import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostCard from "@/components/public/PostCard";
import Pagination from "@/components/public/Pagination";
import Reveal from "@/components/public/Reveal";
import { countVisiblePosts, getCategory, listVisiblePosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

const PER_PAGE = 9;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = safeDecode((await params).slug);
  const cat = await getCategory(slug);
  if (!cat) return { title: "القسم غير موجود" };
  return { title: cat.name, description: `مقالات قسم «${cat.name}» في المدونة.` };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const slug = safeDecode((await params).slug);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(String(sp.page || "1"), 10) || 1);

  const cat = await getCategory(slug);
  if (!cat) notFound();

  const total = await countVisiblePosts({ categorySlug: slug });
  const posts = await listVisiblePosts({
    categorySlug: slug,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Reveal>
        <span className="chip">قسم</span>
        <h1 className="mt-4 text-3xl font-black text-zinc-900 dark:text-white sm:text-4xl">{cat.name}</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {total} {total === 1 ? "مقال" : "مقالات"} في هذا القسم
        </p>
      </Reveal>

      {posts.length === 0 ? (
        <div className="card mt-10 p-10 text-center">
          <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">لا توجد مقالات في هذا القسم بعد</p>
        </div>
      ) : (
        <Reveal className="mt-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination page={page} total={total} perPage={PER_PAGE} basePath={`/category/${slug}`} />
        </Reveal>
      )}
    </div>
  );
}
