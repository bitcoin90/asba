// استعلامات الواجهة العامة
import { one, query } from "./db";
import type { AdRow, CategoryRow, PageRow, PostRow } from "./types";

/** شرط المقالات المرئية: منشورة، أو مجدولة ووصل موعدها (تعمل الجدولة دون cron) */
const VISIBLE =
  "(p.status = 'published' OR (p.status = 'scheduled' AND p.published_at IS NOT NULL AND p.published_at <= ?))";

const POST_SELECT = `
  SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM posts p LEFT JOIN categories c ON c.id = p.category_id
`;

export async function listVisiblePosts(opts: {
  limit?: number;
  offset?: number;
  categorySlug?: string;
  q?: string;
  featured?: boolean;
  excludeId?: number;
}): Promise<PostRow[]> {
  const params: any[] = [new Date().toISOString()];
  const where: string[] = [VISIBLE];
  if (opts.categorySlug) {
    where.push("c.slug = ?");
    params.push(opts.categorySlug);
  }
  if (opts.featured) {
    where.push("p.featured = 1");
  }
  if (opts.q) {
    where.push("(LOWER(p.title) LIKE ? OR LOWER(p.content) LIKE ? OR LOWER(p.excerpt) LIKE ?)");
    const like = `%${opts.q.toLowerCase()}%`;
    params.push(like, like, like);
  }
  if (opts.excludeId) {
    where.push("p.id != ?");
    params.push(opts.excludeId);
  }
  params.push(opts.limit ?? 10, opts.offset ?? 0);
  return query<PostRow>(
    `${POST_SELECT} WHERE ${where.join(" AND ")} ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT ? OFFSET ?`,
    params
  );
}

export async function countVisiblePosts(opts: {
  categorySlug?: string;
  q?: string;
}): Promise<number> {
  const params: any[] = [new Date().toISOString()];
  const where: string[] = [VISIBLE];
  if (opts.categorySlug) {
    where.push("c.slug = ?");
    params.push(opts.categorySlug);
  }
  if (opts.q) {
    where.push("(LOWER(p.title) LIKE ? OR LOWER(p.content) LIKE ? OR LOWER(p.excerpt) LIKE ?)");
    const like = `%${opts.q.toLowerCase()}%`;
    params.push(like, like, like);
  }
  const row = await one<{ c: number }>(
    `SELECT COUNT(*) AS c FROM posts p LEFT JOIN categories c ON c.id = p.category_id WHERE ${where.join(" AND ")}`,
    params
  );
  return Number(row?.c ?? 0);
}

export async function getVisiblePost(slug: string): Promise<PostRow | null> {
  return one<PostRow>(
    `${POST_SELECT} WHERE p.slug = ? AND ${VISIBLE}`,
    [slug, new Date().toISOString()]
  );
}

export async function getPostAnyStatus(slug: string): Promise<PostRow | null> {
  return one<PostRow>(`${POST_SELECT} WHERE p.slug = ?`, [slug]);
}

export async function listCategories(): Promise<CategoryRow[]> {
  return query<CategoryRow>(
    `SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND
      (p.status = 'published' OR (p.status = 'scheduled' AND p.published_at IS NOT NULL AND p.published_at <= ?))
    ) AS count FROM categories c ORDER BY c.created_at ASC`,
    [new Date().toISOString()]
  );
}

export async function getCategory(slug: string): Promise<CategoryRow | null> {
  return one<CategoryRow>("SELECT * FROM categories WHERE slug = ?", [slug]);
}

export async function listPages(): Promise<PageRow[]> {
  return query<PageRow>("SELECT * FROM pages ORDER BY id ASC");
}

export async function getPage(slug: string): Promise<PageRow | null> {
  return one<PageRow>("SELECT * FROM pages WHERE slug = ?", [slug]);
}

export async function getAdsMap(): Promise<Record<string, AdRow>> {
  const rows = await query<AdRow>("SELECT * FROM ads");
  const map: Record<string, AdRow> = {};
  for (const r of rows) map[r.placement] = r;
  return map;
}

export async function recordView(path: string, slug?: string): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  await query(
    `INSERT INTO views (stat_key, day, count) VALUES (?, ?, 1)
     ON CONFLICT (stat_key, day) DO UPDATE SET count = count + 1`,
    [path, day]
  );
  if (slug) {
    await query("UPDATE posts SET views = views + 1 WHERE slug = ?", [slug]);
  }
}
