// كتابة بيانات التحقق الحي مباشرة في Turso (ملف جذر + كود head)
import { createClient } from "@libsql/client";
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const url = get("LIBSQL_URL");
const token = get("LIBSQL_AUTH_TOKEN");
if (!url || !token) throw new Error("missing LIBSQL creds");

const db = createClient({ url, authToken: token });

await db.execute(
  `CREATE TABLE IF NOT EXISTS root_files (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, content TEXT NOT NULL DEFAULT '', mime TEXT NOT NULL DEFAULT 'text/plain', updated_at TEXT NOT NULL)`
);
await db.execute({
  sql: `INSERT OR REPLACE INTO root_files (name, content, mime, updated_at) VALUES (?, ?, ?, ?)`,
  args: ["asba-verify-test.txt", "ASBA-VERIFY-OK-12345", "text/plain; charset=utf-8", new Date().toISOString()],
});
await db.execute({
  sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('head_code', ?)`,
  args: [`<meta name="asba-head-test" content="ok" />`],
});
console.log("TURSO-SEED-OK");
