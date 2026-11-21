import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query, one, insert, update, nowISO } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { sanitizePostPayload, type PostPayload } from "@/lib/post-payload";
import type { PostRow } from "@/lib/types";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") || "";
    const categoryId = sp.get("category") || "";
    const q = (sp.get("q") || "").trim();
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const perPage = 20;

    const where: string[] = ["1=1"];
    const params: any[] = [];
    if (status && ["draft", "published", "scheduled"].includes(status)) {
      where.push("p.status = ?");
      params.push(status);
    }
    if (categoryId && /^\d+$/.test(categoryId)) {
      where.push("p.category_id = ?");
      params.push(parseInt(categoryId, 10));
    }
    if (q) {
      where.push("LOWER(p.title) LIKE ?");
      params.push(`%${q.toLowerCase()}%`);
    }

    const rows = await query<PostRow>(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${where.join(" AND ")}
       ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`,
      [...params, perPage, (page - 1) * perPage]
    );
    const totalRow = await one<{ c: number }>(
      `SELECT COUNT(*) AS c FROM posts p WHERE ${where.join(" AND ")}`,
      params
    );

    return NextResponse.json({ posts: rows, total: Number(totalRow?.c ?? 0), page, perPage });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const body = await req.json();
    const res = await sanitizePostPayload(body);
    if ("error" in res && res.error) return NextResponse.json({ error: res.error }, { status: 400 });
    const id = await insert("posts", {
      ...(res.data as Record<string, any>),
      views: 0,
      created_at: nowISO(),
      updated_at: nowISO(),
    });
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    if (String(e?.message || "").includes("UNIQUE")) {
      return NextResponse.json({ error: "الرابط (slug) مستخدم بالفعل" }, { status: 400 });
    }
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
