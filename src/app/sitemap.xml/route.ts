import { listVisiblePosts, listCategories, listPages } from "@/lib/queries";
import { METADATA_BASE } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = await METADATA_BASE();
  const posts = await listVisiblePosts({ limit: 1000 });
  const categories = await listCategories();
  const pages = await listPages();

  const staticPaths = [
    "/",
    "/posts",
    ...categories.map((c) => `/category/${encodeURIComponent(c.slug)}`),
  ];
  const pageSlugs = pages.map((p) => `/page/${encodeURIComponent(p.slug)}`);

  const urls = [
    ...staticPaths,
    ...pageSlugs,
    ...posts.map((p) => `/post/${p.slug}`),
  ]
    .map((path) => {
      return `  <url>
    <loc>${base}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.7"}</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "no-store" },
  });
}
