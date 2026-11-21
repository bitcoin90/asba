import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query, one, nowISO } from "@/lib/db";
import type { PageRow } from "@/lib/types";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { slug } = await ctx.params;
  const row = await one<PageRow>("SELECT * FROM pages WHERE slug = ?", [decodeURIComponent(slug)]);
  if (!row) return NextResponse.json({ error: "الصفحة غير موجودة" }, { status: 404 });
  return NextResponse.json({ page: row });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { slug } = await ctx.params;
  try {
    const body = await req.json();
    const title = String(body.title || "").trim().slice(0, 200);
    if (!title) return NextResponse.json({ error: "عنوان الصفحة مطلوب" }, { status: 400 });
    const existing = await one<PageRow>("SELECT id FROM pages WHERE slug = ?", [decodeURIComponent(slug)]);
    if (!existing) return NextResponse.json({ error: "الصفحة غير موجودة" }, { status: 404 });
    await query("UPDATE pages SET title = ?, content = ?, updated_at = ? WHERE slug = ?", [
      title,
      String(body.content || ""),
      nowISO(),
      decodeURIComponent(slug),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { slug } = await ctx.params;
  try {
    await query("DELETE FROM pages WHERE slug = ?", [decodeURIComponent(slug)]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
