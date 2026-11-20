import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query, one, nowISO } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { PageRow } from "@/lib/types";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const rows = await query<PageRow>("SELECT * FROM pages ORDER BY id ASC");
  return NextResponse.json({ pages: rows });
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  try {
    const body = await req.json();
    const title = String(body.title || "").trim().slice(0, 200);
    if (!title) return NextResponse.json({ error: "عنوان الصفحة مطلوب" }, { status: 400 });

    const base = slugify(String(body.slug || title)) || `page-${Date.now().toString(36)}`;
    let slug = base;
    let i = 2;
    while (await one("SELECT id FROM pages WHERE slug = ?", [slug])) {
      slug = `${base}-${i++}`;
      if (i > 100) { slug = `${base}-${Date.now().toString(36)}`; break; }
    }
    const { insert } = await import("@/lib/db");
    const id = await insert("pages", {
      slug,
      title,
      content: String(body.content || ""),
      updated_at: nowISO(),
    });
    return NextResponse.json({ ok: true, id, slug });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
