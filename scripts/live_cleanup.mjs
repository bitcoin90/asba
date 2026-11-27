// تنظيف بيانات التحقق الحي من Turso
import { createClient } from "@libsql/client";
import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim().replace(/^["']|["']$/g, "");
const db = createClient({ url: get("LIBSQL_URL"), authToken: get("LIBSQL_AUTH_TOKEN") });

await db.execute({ sql: `DELETE FROM root_files WHERE name = 'asba-verify-test.txt'` });
await db.execute({ sql: `DELETE FROM settings WHERE key = 'head_code'` });
console.log("TURSO-CLEANUP-OK");
