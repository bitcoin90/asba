import { listVisiblePosts, listCategories, listPages } from "@/lib/queries";
import { METADATA_BASE } from "@/lib/site";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const base = await METADATA_BASE();
  const [posts, categories, pages] = await Promise.all([
    listVisiblePosts({ limit: 2000 }),
    listCategories(),
    listPages(),
  ]);

  const urls: string[] = [];

  // الرئيسية — تتحدث مع أحدث تعديل في المقالات
  const latestMod = posts[0]?.updated_at || posts[0]?.published_at;
  urls.push(
    `  <url>\n    <loc>${base}</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>${
      latestMod ? `\n    <lastmod>${esc(latestMod)}</lastmod>` : ""
    }\n  </url>`
  );

  // قائمة المقالات
  urls.push(
    `  <url>\n    <loc>${base}posts</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`
  );

  // التصنيفات
  for (const c of categories) {
    urls.push(
      `  <url>\n    <loc>${base}category/${encodeURIComponent(c.slug)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
    );
  }

  // الصفحات الثابتة
  for (const p of pages) {
    urls.push(
      `  <url>\n    <loc>${base}page/${encodeURIComponent(p.slug)}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n    <lastmod>${esc(p.updated_at)}</lastmod>\n  </url>`
    );
  }

  // المقالات — آخر تحديث تلقائي لكل مقال
  for (const p of posts) {
    urls.push(
      `  <url>\n    <loc>${base}post/${encodeURIComponent(p.slug)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n    <lastmod>${esc(p.updated_at)}</lastmod>\n  </url>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" },
  });
}
