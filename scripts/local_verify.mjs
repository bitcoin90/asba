// اختبار محلي: إدخال ملف جذر + كود head في SQLite المحلي ثم فحص الخادم
import Database from "better-sqlite3";
import path from "node:path";

const db = new Database(path.join(process.cwd(), "data", "asba.db"));

db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '');`);
db.exec(
  `CREATE TABLE IF NOT EXISTS root_files (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, content TEXT NOT NULL DEFAULT '', mime TEXT NOT NULL DEFAULT 'text/plain', updated_at TEXT NOT NULL);`
);

db.prepare(
  `INSERT OR REPLACE INTO root_files (name, content, mime, updated_at) VALUES (?, ?, ?, ?)`
).run("asba-verify-test.txt", "ASBA-VERIFY-OK-12345", "text/plain; charset=utf-8", new Date().toISOString());

db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('head_code', ?)`).run(
  `<meta name="asba-head-test" content="ok" />\n<script async src="https://example.com/ad.js" crossorigin="anonymous"></script>`
);

const f = db.prepare(`SELECT name, mime FROM root_files WHERE name = 'asba-verify-test.txt'`).get();
const s = db.prepare(`SELECT value FROM settings WHERE key = 'head_code'`).get();
console.log("root_file:", JSON.stringify(f));
console.log("head_code:", s.value.slice(0, 60) + "…");
db.close();
console.log("LOCAL-SEED-OK");
