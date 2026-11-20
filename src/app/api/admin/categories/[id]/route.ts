import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query, one, update } from "@/lib/db";
import { slugify } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await ctx.params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });

  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 100);
    if (!name) return NextResponse.json({ error: "اسم التصنيف مطلوب" }, { status: 400 });

    const base = slugify(String(body.slug || name)) || `cat-${numId}`;
    let slug = base;
    let i = 2;
    while (await one("SELECT id FROM categories WHERE slug = ? AND id != ?", [slug, numId])) {
      slug = `${base}-${i++}`;
      if (i > 100) { slug = `${base}-${Date.now().toString(36)}`; break; }
    }
    await update("categories", numId, { name, slug });
    return NextResponse.json({ ok: true, slug });
  } catch {
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
    // فصل المقالات المرتبطة ثم حذف التصنيف
    await query("UPDATE posts SET category_id = NULL WHERE category_id = ?", [numId]);
    await query("DELETE FROM categories WHERE id = ?", [numId]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
