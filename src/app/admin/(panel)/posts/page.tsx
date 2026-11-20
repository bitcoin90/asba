"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fetchJson, EmptyState, PageHeader, Spinner, StatusBanner } from "@/components/admin/adminui";
import { StatusBadge } from "@/components/admin/PostEditor";
import { fmtDate, fmtNumber } from "@/lib/utils";

interface PostRow {
  id: number;
  slug: string;
  title: string;
  status: string;
  category_name: string | null;
  views: number;
  featured: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [status2, setStatus2] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });
  const [page, setPage] = useState(1);

  const load = useCallback(async (opts: { q: string; status: string; category: string; page: number }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (opts.q) params.set("q", opts.q);
      if (opts.status) params.set("status", opts.status);
      if (opts.category) params.set("category", opts.category);
      params.set("page", String(opts.page));
      const json = await fetchJson<{ posts: PostRow[]; total: number }>(`/api/admin/posts?${params}`);
      setPosts(json.posts);
      setTotal(json.total);
    } catch (e: any) {
      setStatus2({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("status") || "";
    setStatus(s);
    fetchJson<{ categories: { id: number; name: string }[] }>("/api/admin/categories")
      .then((j) => setCategories(j.categories))
      .catch(() => {});
    load({ q: "", status: s, category: "", page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters(next: { q?: string; status?: string; category?: string; page?: number }) {
    const nq = next.q ?? q;
    const ns = next.status ?? status;
    const nc = next.category ?? category;
    const np = next.page ?? 1;
    setQ(nq); setStatus(ns); setCategory(nc); setPage(np);
    load({ q: nq, status: ns, category: nc, page: np });
  }

  async function remove(p: PostRow) {
    if (!confirm(`حذف «${p.title}» نهائيًا؟`)) return;
    try {
      await fetchJson(`/api/admin/posts/${p.id}`, { method: "DELETE" });
      setStatus2({ type: "ok", text: "تم حذف المقال" });
      load({ q, status, category, page });
    } catch (e: any) {
      setStatus2({ type: "error", text: e.message });
    }
  }

  const perPage = 20;
  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <PageHeader
        title="المقالات"
        desc={`المجموع: ${total} مقال`}
        action={
          <Link href="/admin/posts/new" className="btn-primary">+ مقال جديد</Link>
        }
      />
      <StatusBanner status={status2} />

      <div className="card mb-5 flex flex-wrap items-center gap-3 p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters({ q })}
          className="input max-w-xs flex-1"
          placeholder="ابحث بالعنوان… ثم Enter"
        />
        <select value={status} onChange={(e) => applyFilters({ status: e.target.value })} className="input max-w-40">
          <option value="">كل الحالات</option>
          <option value="published">منشور</option>
          <option value="draft">مسودة</option>
          <option value="scheduled">مجدول</option>
        </select>
        <select value={category} onChange={(e) => applyFilters({ category: e.target.value })} className="input max-w-48">
          <option value="">كل التصنيفات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button onClick={() => applyFilters({})} className="btn-ghost !py-2 text-xs">تحديث</button>
      </div>

      {loading ? (
        <Spinner />
      ) : posts.length === 0 ? (
        <EmptyState title="لا توجد مقالات" desc="أنشئ أول مقال لك من زر «مقال جديد»." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-right text-xs text-zinc-500 dark:border-zinc-800">
                <th className="px-4 py-3 font-bold">العنوان</th>
                <th className="px-4 py-3 font-bold">الحالة</th>
                <th className="px-4 py-3 font-bold">التصنيف</th>
                <th className="px-4 py-3 font-bold">المشاهدات</th>
                <th className="px-4 py-3 font-bold">آخر تعديل</th>
                <th className="px-4 py-3 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {posts.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="max-w-72 px-4 py-3">
                    <Link href={`/admin/posts/${p.id}`} className="font-bold text-zinc-800 hover:text-[var(--brand)] dark:text-zinc-200">
                      {p.title}
                    </Link>
                    {p.featured === 1 && <span className="chip mr-2 !px-2 !py-0.5 text-[10px]">مميز</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-zinc-500">{p.category_name || "—"}</td>
                  <td className="px-4 py-3 text-zinc-500">{fmtNumber(p.views)}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{fmtDate(p.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/posts/${p.id}`} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">تعديل</Link>
                      <a href={`/post/${p.slug}`} target="_blank" rel="noopener" className="btn-ghost !px-2.5 !py-1.5 text-[11px]">عرض</a>
                      <button onClick={() => remove(p)} className="btn bg-red-50 !px-2.5 !py-1.5 text-[11px] text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-zinc-100 p-4 dark:border-zinc-800">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => applyFilters({ page: n })}
                  className={`h-9 min-w-9 rounded-lg px-2 text-xs font-bold ${
                    n === page ? "text-white" : "border border-zinc-200 text-zinc-500 dark:border-zinc-700"
                  }`}
                  style={n === page ? { backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-2))" } : undefined}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
