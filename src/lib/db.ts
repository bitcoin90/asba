// طبقة الاتصال بقاعدة البيانات — تدعم Turso/libSQL على الإنتاج، وPostgres، وSQLite للتطوير المحلي
import type { Row } from "./types";

/** إعدادات Turso: LIBSQL_URL أو DATABASE_URL يبدأ بـ libsql:// — مع التوكن من LIBSQL_AUTH_TOKEN أو DATABASE_AUTH_TOKEN */
export function libsqlConfig(): { url: string; authToken: string } | null {
  const url = process.env.LIBSQL_URL || (/^libsql:/.test(process.env.DATABASE_URL || "") ? (process.env.DATABASE_URL as string) : "");
  if (!url) return null;
  const authToken = process.env.LIBSQL_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || "";
  return { url, authToken };
}

export function hasLibsql(): boolean {
  return !!libsqlConfig();
}

export function hasPostgres(): boolean {
  return !hasLibsql() && /^postgres(ql)?:/.test(process.env.DATABASE_URL || "");
}

declare global {
  // eslint-disable-next-line no-var
  var __asbaPool: any;
  // eslint-disable-next-line no-var
  var __asbaLibsql: any;
  // eslint-disable-next-line no-var
  var __asbaSchema: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var __asbaSqlite: any;
}

function getSqlite(): any {
  if (!globalThis.__asbaSqlite) {
    // على منصات الاستضافة (مثل Vercel) نظام الملفات للقراءة فقط وبيئة SQLite المحلية غير صالحة:
    // أعطِ خطأً واضحًا يشرح الحل بدل انهيار غامض
    if (process.env.VERCEL) {
      throw new Error(
        "DATABASE NOT CONFIGURED: لم يتم ضبط متغيرات قاعدة البيانات في Vercel. " +
          "أضف LIBSQL_URL و LIBSQL_AUTH_TOKEN في Project Settings → Environment Variables ثم أعد النشر."
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require("better-sqlite3");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require("path");
    const dir = path.join(process.cwd(), "data");
    fs.mkdirSync(dir, { recursive: true });
    const db = new Database(path.join(dir, "asba.db"));
    db.pragma("journal_mode = WAL");
    globalThis.__asbaSqlite = db;
  }
  return globalThis.__asbaSqlite;
}

/** عميل Turso/libSQL — عمولة واحدة معاد استخدامها عبر عمر العملية */
async function getLibsql(): Promise<any> {
  if (!globalThis.__asbaLibsql) {
    const { createClient } = await import("@libsql/client");
    globalThis.__asbaLibsql = createClient(libsqlConfig() as any);
  }
  return globalThis.__asbaLibsql;
}

async function getPool(): Promise<any> {
  if (!globalThis.__asbaPool) {
    const { Pool } = await import("pg");
    const url = process.env.DATABASE_URL as string;
    const ssl = /localhost|127\.0\.0\.1|sslmode=disable/.test(url)
      ? undefined
      : { rejectUnauthorized: false };
    const pool = new Pool({ connectionString: url, max: 3, ssl });
    // على Vercel: أبلغ المنصة عن اتصالات Pool النشطة لتوزيع الاستدعاءات المتزامنة بأمان
    try {
      const { attachDatabasePool } = await import("@vercel/functions");
      attachDatabasePool(pool);
    } catch {}
    globalThis.__asbaPool = pool;
  }
  return globalThis.__asbaPool;
}

export async function query<T = Row>(sql: string, params: any[] = []): Promise<T[]> {
  await ensureSeedOnce();
  return q<T>(sql, params);
}

/** المنفّذ الخام — يضمن وجود الجداول فقط (يستخدمه البذر نفسه لتجنّب الاعتماد الدائري) */
export async function q<T = Row>(sql: string, params: any[] = []): Promise<T[]> {
  await ensureDDL();
  if (hasLibsql()) {
    const db = await getLibsql();
    const res = await db.execute({ sql, args: params });
    return (res.rows ?? []) as T[];
  }
  if (hasPostgres()) {
    let i = 0;
    const converted = sql.replace(/\?/g, () => `$${++i}`);
    const pool = await getPool();
    const res = await pool.query(converted, params);
    return (res?.rows ?? []) as T[];
  }
  const isReader =
    /\bRETURNING\b/i.test(sql) || /^\s*(SELECT|WITH|PRAGMA)/i.test(sql);
  const db = getSqlite();
  if (isReader) return db.prepare(sql).all(...params) as T[];
  // عبارات الكتابة لا تُعيد صفوفًا في better-sqlite3
  db.prepare(sql).run(...params);
  return [];
}

export async function one<T = Row>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows.length ? rows[0] : null;
}

const ID_TABLES = new Set(["posts", "categories", "pages", "media", "ads", "messages"]);

/** إدخال صف وإرجاع المعرف الجديد (للجداول ذات عمود id) */
export async function insert(table: string, data: Record<string, any>): Promise<number> {
  const keys = Object.keys(data);
  const cols = keys.join(", ");
  const marks = keys.map(() => "?").join(", ");
  if (ID_TABLES.has(table)) {
    const row = await one(`INSERT INTO ${table} (${cols}) VALUES (${marks}) RETURNING id`, Object.values(data));
    return Number(row?.id ?? 0);
  }
  await q(`INSERT INTO ${table} (${cols}) VALUES (${marks})`, Object.values(data));
  return 0;
}

/** تحديث صف حسب المعرف */
export async function update(table: string, id: number, data: Record<string, any>): Promise<void> {
  const keys = Object.keys(data);
  if (!keys.length) return;
  const sets = keys.map((k) => `${k} = ?`).join(", ");
  await query(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...Object.values(data), id]);
}

export function nowISO(): string {
  return new Date().toISOString();
}

const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_media_id INTEGER,
  cover_url TEXT,
  category_id INTEGER,
  tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  og_media_id INTEGER,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 0,
  height INTEGER NOT NULL DEFAULT 0,
  data BLOB NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  placement TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS views (
  stat_key TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (stat_key, day)
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS root_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  mime TEXT NOT NULL DEFAULT 'text/plain',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS short_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

const PG_SCHEMA = `
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_media_id INTEGER,
  cover_url TEXT,
  category_id INTEGER,
  tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  og_media_id INTEGER,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 0,
  height INTEGER NOT NULL DEFAULT 0,
  data BYTEA NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  placement TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS views (
  stat_key TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (stat_key, day)
);
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS root_files (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  mime TEXT NOT NULL DEFAULT 'text/plain',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS short_links (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export function ensureDDL(): Promise<void> {
  if (!globalThis.__asbaSchema) {
    globalThis.__asbaSchema = (async () => {
      if (hasLibsql()) {
        const db = await getLibsql();
        const stmts = SQLITE_SCHEMA.split(";")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((sql) => ({ sql, args: [] }));
        await db.batch(stmts, "write");
      } else if (hasPostgres()) {
        const pool = await getPool();
        await pool.query(PG_SCHEMA);
      } else {
        getSqlite().exec(SQLITE_SCHEMA);
      }
    })().catch((err) => {
      globalThis.__asbaSchema = undefined;
      throw err;
    });
  }
  return globalThis.__asbaSchema;
}

let seedPromise: Promise<void> | null = null;

/** يضمن الجداول + البيانات الأولية (يُستدعى من طبقة الاستعلامات العامة) */
export function ensureData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      await ensureDDL();
      const { ensureSeed } = await import("./seed");
      await ensureSeed();
    })().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

// توافق مع الاستدعاءات القديمة
const ensureSchema = ensureDDL;
void ensureSchema;

async function ensureSeedOnce(): Promise<void> {
  await ensureData();
}
