import Link from "next/link";
import type { Metadata } from "next";
import PostCard from "@/components/public/PostCard";
import AdSlot from "@/components/public/AdSlot";
import Reveal from "@/components/public/Reveal";
import { listVisiblePosts, listCategories, getAdsMap } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { METADATA_BASE } from "@/lib/site";
import { fmtNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: s.site_name,
    description: s.site_description,
  };
}

export default async function HomePage() {
  const settings = await getSettings();
  const ads = await getAdsMap();
  const now = new Date().toISOString();

  const [featured, latest, categories] = await Promise.all([
    listVisiblePosts({ featured: true, limit: 3 }),
    listVisiblePosts({ limit: 9, offset: 0 }),
    listCategories(),
  ]);

  // GEO — بيانات منظمة للرئيسية: WebSite + Organization لفهم النماذج ومحركات البحث
  const base = await METADATA_BASE();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.site_name,
      url: `${base}/`,
      description: settings.site_description,
      inLanguage: "ar",
      publisher: { "@type": "Organization", name: settings.site_name },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${base}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: settings.site_name,
      url: `${base}/`,
      description: settings.about_short,
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* قسم الترحيب */}
      <section className="hero-mesh relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pb-20 sm:pt-28">
          <div className="animate-fadeUp">
            <span className="chip mx-auto mb-6 !px-4 !py-1.5 text-sm">مدونة تقنية بالعربية</span>
          </div>
          <h1 className="mx-auto max-w-3xl animate-fadeUp text-4xl font-black leading-[1.35] text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl">
            أهلًا بك في <span className="gradient-text">{settings.site_name}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-fadeUp text-lg leading-9 text-zinc-600 dark:text-zinc-400">
            {settings.site_tagline} — مقالات وشروحات ومشاريع حقيقية تشرح التقنية وتقربها إليك بأسلوب
            عملي وواضح.
          </p>
          <div className="mt-9 flex animate-fadeUp flex-wrap items-center justify-center gap-3">
            <Link href="/posts" className="btn-primary !px-7 !py-3 text-base">
              استكشف المقالات
            </Link>
            {settings.about_short && (
              <Link href="/page/about" className="btn-ghost !px-7 !py-3 text-base">
                تعرف علينا
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdSlot placement="home_top" code={ads.home_top?.enabled ? ads.home_top.code : ""} enabled={!!ads.home_top?.enabled} minHeight={90} />

        {/* المقالات المميزة */}
        {featured.length > 0 && (
          <Reveal className="mt-14">
            <h2 className="section-title mb-8">المقالات المميزة</h2>
            <div className="grid gap-6">
              {featured.slice(0, 1).map((post) => (
                <PostCard key={post.id} post={post} featured />
              ))}
              {featured.length > 1 && (
                <div className="grid gap-6 md:grid-cols-2">
                  {featured.slice(1).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        )}

        {/* أحدث المقالات */}
        {latest.length > 0 && (
          <Reveal className="mt-16">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="section-title">أحدث المقالات</h2>
              <Link
                href="/posts"
                className="text-sm font-bold text-[var(--brand)] transition-transform hover:translate-x-[-2px]"
              >
                عرض الكل ←
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </Reveal>
        )}

        {/* الأقسام */}
        {categories.length > 0 && (
          <Reveal className="mt-16">
            <h2 className="section-title mb-8">تصفح الأقسام</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="card flex items-center gap-2 px-5 py-3 text-sm font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:shadow-soft dark:text-zinc-200"
                >
                  {c.name}
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {fmtNumber(c.count || 0)}
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        )}

        {/* التعريف بصاحب المدونة */}
        <Reveal className="mt-16">
          <div className="card hero-mesh overflow-hidden p-8 sm:p-10">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-soft" style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}>
                {(settings.author_name || "A").slice(0, 1)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  عن صاحب المدونة — {settings.author_name}
                </h2>
                <p className="mt-3 leading-8 text-zinc-600 dark:text-zinc-400">{settings.about_short}</p>
                <Link href="/page/about" className="mt-4 inline-block text-sm font-bold text-[var(--brand)]">
                  المزيد عنا ←
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        <AdSlot placement="home_bottom" code={ads.home_bottom?.enabled ? ads.home_bottom.code : ""} enabled={!!ads.home_bottom?.enabled} minHeight={90} />
      </div>
    </>
  );
}
