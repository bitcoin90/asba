import type { Metadata } from "next";
import PostCard from "@/components/public/PostCard";
import Pagination from "@/components/public/Pagination";
import Reveal from "@/components/public/Reveal";
import { countVisiblePosts, listVisiblePosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "جميع المقالات",
  description: "تصفح جميع مقالات المدونة مرتبة من الأحدث إلى الأقدم.",
};

const PER_PAGE = 9;

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(String(sp.page || "1"), 10) || 1);

  const total = await countVisiblePosts({});
  const posts = await listVisiblePosts({ limit: PER_PAGE, offset: (page - 1) * PER_PAGE });

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Reveal>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white sm:text-4xl">جميع المقالات</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">كل ما نُشر في المدونة، مرتب من الأحدث إلى الأقدم.</p>
      </Reveal>

      {posts.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">لا توجد مقالات منشورة بعد</p>
          <p className="mt-2 text-sm text-zinc-500">سيتوفر المحتوى قريبًا.</p>
        </div>
      ) : (
        <Reveal className="mt-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination page={page} total={total} perPage={PER_PAGE} basePath="/posts" />
        </Reveal>
      )}
    </div>
  );
}
