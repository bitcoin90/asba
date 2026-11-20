import { listVisiblePosts } from "@/lib/queries";
import { METADATA_BASE } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import { stripHtml, xmlEscape } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = await METADATA_BASE();
  const settings = await getSettings();
  const posts = await listVisiblePosts({ limit: 30 });

  const items = posts
    .map(
      (p) => `    <item>
      <title>${xmlEscape(p.title)}</title>
      <link>${base}post/${encodeURIComponent(p.slug)}</link>
      <guid isPermaLink="true">${base}post/${encodeURIComponent(p.slug)}</guid>
      <pubDate>${new Date(p.published_at || p.created_at).toUTCString()}</pubDate>
      <description>${xmlEscape(p.excerpt || stripHtml(p.content).slice(0, 200))}</description>
      ${p.category_name ? `<category>${xmlEscape(p.category_name)}</category>` : ""}
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(settings.site_name)}</title>
    <link>${base}</link>
    <description>${xmlEscape(settings.site_description)}</description>
    <language>ar</language>
    <atom:link href="${base}rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "no-store" },
  });
}
