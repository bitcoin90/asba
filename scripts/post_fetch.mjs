// جلب المقال المطلوب إيقافه وتنظيمه من Turso
import { createClient } from "@libsql/client";
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const db = createClient({ url: get("LIBSQL_URL"), authToken: get("LIBSQL_AUTH_TOKEN") });

const cols = await db.execute(`PRAGMA table_info(posts)`);
const names = cols.rows.map((c) => c.name);
console.log("columns:", names.join(", "));
const has = (c) => names.includes(c);

const r = await db.execute({
  sql: `SELECT * FROM posts WHERE title LIKE '%نداء%' OR title LIKE '%إيجنتك الذكي%'`,
});

for (const row of r.rows) {
  const meta = { ...row, content: undefined };
  console.log(JSON.stringify(meta, null, 2));
  fs.writeFileSync(`/tmp/post-content-${row.id}.html`, String(row.content ?? ""), "utf8");
  console.log(`content saved: /tmp/post-content-${row.id}.html (${String(row.content ?? "").length} chars)`);
}
if (r.rows.length === 0) console.log("NOT-FOUND");
