import { NextResponse } from "next/server";
import { hasLibsql, hasPostgres, libsqlConfig, q } from "@/lib/db";

export const dynamic = "force-dynamic";

/** نقطة تشخيص: تُظهر وضع قاعدة البيانات الحالي وأساسيّ حالتها — بدون أي أسرار */
export async function GET() {
  try {
    const mode = hasLibsql() ? "turso" : hasPostgres() ? "postgres" : "sqlite-local";
    const host = hasLibsql()
      ? new URL(libsqlConfig()!.url).hostname
      : hasPostgres()
        ? (() => { try { return new URL(process.env.DATABASE_URL!).hostname; } catch { return "invalid-url"; } })()
        : "data/asba.db (local)";

    const tables = await q<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    let posts = -1;
    try {
      const r = await q<{ c: number }>("SELECT COUNT(*) AS c FROM posts");
      posts = Number(r[0]?.c ?? 0);
    } catch {}

    return NextResponse.json({
      status: "ok",
      db: { mode, host, tables: tables.map((t) => t.name), posts },
      time: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        hint: "تحقق من متغيرات البيئة: LIBSQL_URL + LIBSQL_AUTH_TOKEN في إعدادات المشروع على Vercel ثم أعد النشر",
        error: String(err?.message || err).slice(0, 300),
      },
      { status: 500 }
    );
  }
}
