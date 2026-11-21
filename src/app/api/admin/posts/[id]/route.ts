import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query, one, update, nowISO } from "@/lib/db";
import { sanitizePostPayload } from "@/lib/post-payload";
import type { PostRow } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });

  const row = await one<PostRow>(
    `SELECT p.*, c.name AS category_name FROM posts p
     LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
    [parseInt(id, 10)]
  );
  if (!row) return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });
  return NextResponse.json({ post: row });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await ctx.params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });

  try {
    const existing = await one<PostRow>("SELECT * FROM posts WHERE id = ?", [numId]);
    if (!existing) return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });

    const body = await req.json();
    const res = await sanitizePostPayload(body, numId);
    if ("error" in res && res.error) return NextResponse.json({ error: res.error }, { status: 400 });

    await update("posts", numId, { ...(res.data as Record<string, any>), updated_at: nowISO() });
    return NextResponse.json({ ok: true, id: numId });
  } catch (e: any) {
    if (String(e?.message || "").includes("UNIQUE")) {
      return NextResponse.json({ error: "الرابط (slug) مستخدم بالفعل" }, { status: 400 });
    }
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await ctx.params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });

  try {
    await query("DELETE FROM posts WHERE id = ?", [numId]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
