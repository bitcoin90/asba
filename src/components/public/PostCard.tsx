import Link from "next/link";
import type { PostRow } from "@/lib/types";
import { fmtDate, fmtNumber, parseTags, readingMinutes } from "@/lib/utils";

export default function PostCard({ post, featured = false }: { post: PostRow; featured?: boolean }) {
  const cover = post.cover_url || (post.cover_media_id ? `/api/media/${post.cover_media_id}` : "");
  return (
    <article
      className={`card group overflow-hidden hover:shadow-soft ${
        featured ? "lg:flex lg:flex-row-reverse" : "flex flex-col"
      }`}
    >
      <Link
        href={`/post/${encodeURIComponent(post.slug)}`}
        className={`relative block overflow-hidden ${featured ? "lg:w-1/2" : ""}`}
        aria-label={post.title}
      >
        <div
          className={`relative w-full overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 ${
            featured ? "aspect-[16/10] lg:h-full" : "aspect-[16/9]"
          }`}
        >
          {cover ? (
            <img
              src={cover}
              alt={post.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="gradient-text text-3xl font-black opacity-60">ASBA AI</span>
            </div>
          )}
        </div>
      </Link>

      <div className={`flex flex-1 flex-col p-5 ${featured ? "lg:w-1/2 lg:justify-center lg:p-8" : ""}`}>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          {post.category_slug && (
            <Link href={`/category/${post.category_slug}`} className="chip">
              {post.category_name}
            </Link>
          )}
          {post.status === "scheduled" && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              مجدول
            </span>
          )}
          <span className="text-zinc-500">{readingMinutes(post.content)} دقائق قراءة</span>
        </div>

        <h3
          className={`font-extrabold leading-8 text-zinc-900 transition-colors group-hover:text-[var(--brand)] dark:text-white ${
            featured ? "text-2xl" : "text-lg"
          }`}
        >
          <Link href={`/post/${encodeURIComponent(post.slug)}`}>{post.title}</Link>
        </h3>

        <p className={`mt-3 flex-1 text-sm leading-7 text-zinc-600 dark:text-zinc-400 ${featured ? "" : "line-clamp-3"}`}>
          {post.excerpt}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <span className="text-xs text-zinc-500">{fmtDate(post.published_at || post.created_at)}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {fmtNumber(post.views)}
            </span>
            <Link
              href={`/post/${encodeURIComponent(post.slug)}`}
              className="text-sm font-bold text-[var(--brand)] transition-transform hover:translate-x-[-2px]"
            >
              اقرأ المزيد ←
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
