"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchJson, EmptyState, PageHeader, Spinner, StatusBanner } from "@/components/admin/adminui";

interface PageRow {
  id: number;
  slug: string;
  title: string;
  updated_at: string;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await fetchJson<{ pages: PageRow[] }>("/api/admin/pages");
      setPages(json.pages);
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addPage() {
    const title = window.prompt("عنوان الصفحة الجديدة:");
    if (!title || !title.trim()) return;
    try {
      const res = await fetchJson<{ slug: string }>("/api/admin/pages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: "" }),
      });
      router.push(`/admin/pages/${res.slug}`);
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  async function remove(p: PageRow) {
    if (!confirm(`حذف صفحة «${p.title}»؟ إن كانت مرتبطة بروابط القائمة أو التذييل فسيختفي رابطها.`)) return;
    try {
      await fetchJson(`/api/admin/pages/${p.slug}`, { method: "DELETE" });
      setStatus({ type: "ok", text: "تم حذف الصفحة" });
      await load();
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  return (
    <>
      <PageHeader
        title="الصفحات الثابتة"
        desc="عدّل محتوى الصفحات مثل «من نحن» و«سياسة الخصوصية» وغيرها."
        action={<button onClick={addPage} className="btn-primary">+ صفحة جديدة</button>}
      />
      <StatusBanner status={status} />

      {loading ? (
        <Spinner />
      ) : pages.length === 0 ? (
        <EmptyState title="لا توجد صفحات" />
      ) : (
        <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
          {pages.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <Link href={`/admin/pages/${p.slug}`} className="font-bold text-zinc-800 hover:text-[var(--brand)] dark:text-zinc-200">
                  {p.title}
                </Link>
                <span className="mr-3 text-xs text-zinc-400" dir="ltr">/page/{p.slug}</span>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/page/${p.slug}`} target="_blank" rel="noopener" className="btn-ghost !px-2.5 !py-1.5 text-[11px]">عرض</a>
                <Link href={`/admin/pages/${p.slug}`} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">تعديل</Link>
                <button onClick={() => remove(p)} className="btn bg-red-50 !px-2.5 !py-1.5 text-[11px] text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400">حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
