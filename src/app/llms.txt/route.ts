import { listVisiblePosts, listPages } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { METADATA_BASE } from "@/lib/site";

export const dynamic = "force-dynamic";

// llms.txt — المعيار المفتوح (llmstxt.org) لملخص الموقع بنص مقروء للنماذج اللغوية
// تجعل محركات الإجابات التوليدية تفهم الموقع بسرعة وتقتبس منه بدقة
function clean(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const [base, s, posts, pages] = await Promise.all([
    METADATA_BASE(),
    getSettings(),
    listVisiblePosts({ limit: 500 }),
    listPages(),
  ]);

  const lines: string[] = [
    `# ${s.site_name}`,
    "",
    `> ${clean(s.site_description)}`,
    "",
    clean(s.about_short || s.site_tagline),
    "",
    `مدونة عربية يديرها ${s.author_name}، محتواها مقالات وشروحات ومشاريع في الذكاء الاصطناعي والتقنية. لغة الموقع: العربية.`,
    "",
    "## الصفحات الأساسية",
    `- [الرئيسية](${base}): ${clean(s.site_tagline)}`,
    `- [كل المقالات](${base}/posts): أحدث المقالات المنشورة على الموقع`,
  ];

  for (const p of pages) {
    lines.push(`- [${p.title}](${base}/page/${encodeURIComponent(p.slug)}): ${clean(p.content).slice(0, 140)}`);
  }

  lines.push("", "## المقالات");
  for (const p of posts) {
    const date = (p.published_at || p.created_at || "").slice(0, 10);
    lines.push(
      `- [${p.title}](${base}/post/${encodeURIComponent(p.slug)})${date ? ` (${date})` : ""}: ${clean(p.excerpt).slice(0, 160)}`
    );
  }

  lines.push("", "## موجز للآلة", `RSS: ${base}rss.xml`, `Sitemap: ${base}sitemap.xml`, `robots: ${base}robots.txt`);

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
