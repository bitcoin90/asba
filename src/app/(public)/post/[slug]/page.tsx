import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import PostCard from "@/components/public/PostCard";
import AdSlot from "@/components/public/AdSlot";
import ShareButtons from "@/components/public/ShareButtons";
import ViewTracker from "@/components/public/ViewTracker";
import ReadingProgress from "@/components/public/ReadingProgress";
import InlineAds from "@/components/public/InlineAds";
import { getVisiblePost, getPostAnyStatus, listVisiblePosts, getAdsMap, listCategories } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { fmtDate, fmtNumber, injectMiddleAd, parseTags, readingMinutes } from "@/lib/utils";

export const dynamic = "force-dynamic";

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function baseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = safeDecode(rawSlug);
  const post = await getVisiblePost(slug);
  if (!post) return { title: "المقال غير موجود" };
  const s = await getSettings();
  const base = await baseUrl();
  const og = post.og_media_id
    ? `${base}/api/media/${post.og_media_id}`
    : post.cover_url
    ? post.cover_url.startsWith("http")
      ? post.cover_url
      : `${base}${post.cover_url}`
    : `${base}/og-default.png`;
  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    alternates: { canonical: `${base}/post/${encodeURIComponent(post.slug)}` },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: [og],
      type: "article",
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      siteName: s.site_name,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: [og] },
  };
}

export default async function PostPage({ params, searchParams }: Props) {
  const slug = safeDecode((await params).slug);
  const sp = await searchParams;
  const preview = sp.preview === "1";

  let post = preview ? null : await getVisiblePost(slug);
  if (!post && preview) {
    const session = await getSession();
    if (session) post = await getPostAnyStatus(slug);
  }
  if (!post) notFound();

  const [settings, ads, categories] = await Promise.all([
    getSettings(),
    getAdsMap(),
    listCategories(),
  ]);

  const related = await listVisiblePosts({
    limit: 3,
    excludeId: post.id,
    categorySlug: post.category_slug || undefined,
  });
  const fallbackRelated =
    related.length < 3 ? await listVisiblePosts({ limit: 3, excludeId: post.id }) : [];
  const relatedPosts = [...related];
  for (const p of fallbackRelated) {
    if (relatedPosts.length >= 3) break;
    if (!relatedPosts.some((r) => r.id === p.id)) relatedPosts.push(p);
  }

  const cover =
    post.cover_url || (post.cover_media_id ? `/api/media/${post.cover_media_id}` : "");
  const tags = parseTags(post.tags);
  const minutes = readingMinutes(post.content);

  const middleAd =
    ads.article_middle?.enabled && ads.article_middle?.code
      ? `<div data-asba-ad="article_middle" class="ad-slot" aria-hidden="true"></div>`
      : "";
  const content = middleAd ? injectMiddleAd(post.content, middleAd) : post.content;

  const base = await baseUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.seo_description || post.excerpt,
      image: cover ? (cover.startsWith("http") ? cover : `${base}${cover}`) : `${base}/og-default.png`,
      datePublished: post.published_at || post.created_at,
      dateModified: post.updated_at,
      author: { "@type": "Person", name: settings.author_name },
      publisher: { "@type": "Organization", name: settings.site_name },
      keywords: tags.join(", "),
      mainEntityOfPage: `${base}/post/${encodeURIComponent(post.slug)}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: `${base}/` },
        { "@type": "ListItem", position: 2, name: "المقالات", item: `${base}/posts` },
        ...(post.category_slug
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: post.category_name,
                item: `${base}/category/${encodeURIComponent(post.category_slug)}`,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          position: post.category_slug ? 4 : 3,
          name: post.title,
          item: `${base}/post/${encodeURIComponent(post.slug)}`,
        },
      ],
    },
  ];

  return (
    <>
      {preview && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-bold text-white">
          وضع المعاينة — هذه نسخة غير منشورة تظهر لك وحدك
        </div>
      )}
      <ReadingProgress />
      <InlineAds placement="article_middle" code={ads.article_middle?.enabled ? ads.article_middle.code : ""} />      <ViewTracker path={`/post/${post.slug}`} slug={post.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdSlot placement="article_top" code={ads.article_top?.enabled ? ads.article_top.code : ""} enabled={!!ads.article_top?.enabled} minHeight={90} />

        <div className="grid gap-10 pt-10 lg:grid-cols-[1fr_300px]">
          <article>
            <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-zinc-500" aria-label="مسار التنقل">
              <Link href="/" className="hover:text-[var(--brand)]">الرئيسية</Link>
              <span>/</span>
              <Link href="/posts" className="hover:text-[var(--brand)]">المقالات</Link>
              {post.category_slug && (
                <>
                  <span>/</span>
                  <Link href={`/category/${post.category_slug}`} className="hover:text-[var(--brand)]">
                    {post.category_name}
                  </Link>
                </>
              )}
            </nav>

            <h1 className="text-3xl font-black leading-[1.4] text-zinc-900 dark:text-white sm:text-4xl">
              {post.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-zinc-200 pb-6 text-sm text-zinc-500 dark:border-zinc-800">
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}>
                  {(settings.author_name || "A").slice(0, 1)}
                </span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{settings.author_name}</span>
              </span>
              <time dateTime={post.published_at || post.created_at}>{fmtDate(post.published_at || post.created_at)}</time>
              <span>{minutes} دقائق قراءة</span>
              <span className="flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {fmtNumber(post.views)} مشاهدة
              </span>
              {post.category_slug && (
                <Link href={`/category/${post.category_slug}`} className="chip">
                  {post.category_name}
                </Link>
              )}
            </div>

            {cover && (
              <figure className="mt-8">
                <img src={cover} alt={post.title} className="max-h-[480px] w-full rounded-2xl object-cover shadow-soft" />
              </figure>
            )}

            <div className="prose-ar mt-8" dangerouslySetInnerHTML={{ __html: content }} />

            {tags.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">الوسوم:</span>
                {tags.map((t) => (
                  <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="chip">{t}</Link>
                ))}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <ShareButtons title={post.title} />
            </div>

            <AdSlot placement="article_bottom" code={ads.article_bottom?.enabled ? ads.article_bottom.code : ""} enabled={!!ads.article_bottom?.enabled} minHeight={90} />

            {relatedPosts.length > 0 && (
              <section className="mt-14">
                <h2 className="section-title mb-8">مقالات ذات صلة</h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* الشريط الجانبي */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <AdSlot placement="sidebar" code={ads.sidebar?.enabled ? ads.sidebar.code : ""} enabled={!!ads.sidebar?.enabled} minHeight={250} />
            {categories.length > 0 && (
              <div className="card p-5">
                <h3 className="mb-4 text-base font-bold text-zinc-900 dark:text-white">الأقسام</h3>
                <ul className="space-y-2">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/category/${c.slug}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-[var(--brand)] dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        {c.name}
                        <span className="text-xs text-zinc-400">{fmtNumber(c.count || 0)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
