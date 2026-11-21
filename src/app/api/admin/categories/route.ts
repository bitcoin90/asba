import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query, one, insert, update, nowISO } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { CategoryRow } from "@/lib/types";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const rows = await query<CategoryRow>(
    `SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id) AS count
     FROM categories c ORDER BY c.created_at ASC`
  );
  return NextResponse.json({ categories: rows });
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  try {
    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 100);
    if (!name) return NextResponse.json({ error: "اسم التصنيف مطلوب" }, { status: 400 });

    const base = slugify(String(body.slug || name)) || `cat-${Date.now().toString(36)}`;
    let slug = base;
    let i = 2;
    while (await one("SELECT id FROM categories WHERE slug = ?", [slug])) {
      slug = `${base}-${i++}`;
      if (i > 100) { slug = `${base}-${Date.now().toString(36)}`; break; }
    }
    const id = await insert("categories", { name, slug, created_at: nowISO() });
    return NextResponse.json({ ok: true, id, slug });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
