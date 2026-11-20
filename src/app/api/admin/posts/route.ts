import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query, one, insert, update, nowISO } from "@/lib/db";
import { autoExcerpt, slugify, uniqueSlug } from "@/lib/utils";
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

export interface PostPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  cover_media_id?: number | null;
  cover_url?: string | null;
  category_id?: number | null;
  tags?: string[];
  status?: string;
  published_at?: string | null;
  featured?: boolean;
  seo_title?: string;
  seo_description?: string;
  og_media_id?: number | null;
}

export async function sanitizePostPayload(body: PostPayload, excludeId = 0) {
  const title = String(body.title || "").trim().slice(0, 250);
  if (!title) return { error: "عنوان المقال مطلوب" };

  const content = String(body.content || "");
  const excerpt = String(body.excerpt || "").trim().slice(0, 400) || autoExcerpt(content);

  let status = body.status || "draft";
  if (!["draft", "published", "scheduled"].includes(status)) status = "draft";
  let publishedAt: string | null =
    body.published_at ? new Date(body.published_at).toISOString() : null;
  if (status === "scheduled") {
    if (!publishedAt || new Date(publishedAt).getTime() < Date.now()) {
      return { error: "اختر تاريخًا مستقبليًا لجدولة النشر" };
    }
  } else if (status === "published" && !publishedAt) {
    publishedAt = nowISO();
  }

  const slug = await uniqueSlug(body.slug?.trim() || title, async (s) => {
    const row = excludeId
      ? await one<{ id: number }>("SELECT id FROM posts WHERE slug = ? AND id != ?", [s, excludeId])
      : await one<{ id: number }>("SELECT id FROM posts WHERE slug = ?", [s]);
    return !!row;
  });
  // uniqueSlug يضمن عدم التعارض ويولّد بديلًا عند الحاجة
  const finalSlug = slug;

  const categoryId =
    body.category_id && /^\d+$/.test(String(body.category_id))
      ? parseInt(String(body.category_id), 10)
      : null;

  return {
    data: {
      title,
      slug: finalSlug,
      excerpt,
      content,
      cover_media_id: body.cover_media_id ? Number(body.cover_media_id) : null,
      cover_url: body.cover_url ? String(body.cover_url).slice(0, 500) : null,
      category_id: categoryId,
      tags: JSON.stringify(Array.isArray(body.tags) ? body.tags.slice(0, 20).map(String) : []),
      status,
      published_at: publishedAt,
      featured: body.featured ? 1 : 0,
      seo_title: String(body.seo_title || "").slice(0, 200),
      seo_description: String(body.seo_description || "").slice(0, 300),
      og_media_id: body.og_media_id ? Number(body.og_media_id) : null,
    },
  };
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
