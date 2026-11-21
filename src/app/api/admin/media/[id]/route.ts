import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await ctx.params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });

  try {
    // إزالة الصورة من الغلاف/OG لأي مقالات تستخدمها
    await query("UPDATE posts SET cover_media_id = NULL WHERE cover_media_id = ?", [numId]);
    await query("UPDATE posts SET og_media_id = NULL WHERE og_media_id = ?", [numId]);
    await query("DELETE FROM media WHERE id = ?", [numId]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
