import type { Metadata } from "next";
import PostCard from "@/components/public/PostCard";
import Reveal from "@/components/public/Reveal";
import { listVisiblePosts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "البحث",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = String(sp.q || "").trim();
  const results = q.length >= 2 ? await listVisiblePosts({ q, limit: 30 }) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Reveal>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white sm:text-4xl">
          نتائج البحث
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {q.length < 2
            ? "اكتب كلمة أو أكثر للبحث في المقالات."
            : `بحثت عن «${q}» — تم العثور على ${results.length} ${results.length === 1 ? "مقال" : "مقالات"}.`}
        </p>
      </Reveal>

      {q.length >= 2 && results.length === 0 && (
        <div className="card mt-10 p-10 text-center">
          <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300">لا توجد نتائج مطابقة</p>
          <p className="mt-2 text-sm text-zinc-500">جرّب كلمات مفتاحية مختلفة أو تصفح الأقسام من الصفحة الرئيسية.</p>
        </div>
      )}

      {results.length > 0 && (
        <Reveal className="mt-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
