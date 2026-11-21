// تعقيم حمولة المقال المشتركة بين مساري الإضافة والتعديل
// (فُصلت إلى lib لأن ملفات المسارات في Next.js لا تسمح إلا بتصدير المعالجات)
import { one, nowISO } from "./db";
import { autoExcerpt, uniqueSlug } from "./utils";

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
