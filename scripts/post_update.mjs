// إيقاف نشر المقال id=8 وتحديث محتواه بالنسخة المنظمة
import { createClient } from "@libsql/client";
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const db = createClient({ url: get("LIBSQL_URL"), authToken: get("LIBSQL_AUTH_TOKEN") });

const content = fs.readFileSync("/tmp/post-new-8.html", "utf8");
const now = new Date().toISOString();

const r = await db.execute({
  sql: `UPDATE posts SET status = 'draft', content = ?, updated_at = ? WHERE id = 8`,
  args: [content, now],
});

const check = await db.execute({
  sql: `SELECT id, slug, status, LENGTH(content) AS len, updated_at FROM posts WHERE id = 8`,
});
console.log("rows affected:", r.rows_affected);
console.log(JSON.stringify(check.rows[0], null, 2));
console.log("UNPUBLISH+REORG-OK");
