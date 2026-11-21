"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson, EmptyState, PageHeader, Spinner, StatusBanner } from "@/components/admin/adminui";

interface Cat {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export default function CategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [status, setStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await fetchJson<{ categories: Cat[] }>("/api/admin/categories");
      setCats(json.categories);
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!name.trim()) return;
    try {
      await fetchJson("/api/admin/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      setStatus({ type: "ok", text: "تمت إضافة التصنيف" });
      setName("");
      await load();
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  async function rename(id: number) {
    try {
      await fetchJson(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      setEditing(null);
      setStatus({ type: "ok", text: "تم تعديل الاسم" });
      await load();
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  async function remove(c: Cat) {
    if (!confirm(`حذف تصنيف «${c.name}»؟ المقالات التابعة له ستصبح بدون تصنيف.`)) return;
    try {
      await fetchJson(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      setStatus({ type: "ok", text: "تم حذف التصنيف" });
      await load();
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  return (
    <>
      <PageHeader title="التصنيفات والأقسام" desc="نظم مقالاتك في أقسام يسهل على القارئ تصفحها." />
      <StatusBanner status={status} />

      <div className="card mb-6 flex flex-wrap items-center gap-3 p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="input max-w-sm flex-1"
          placeholder="اسم التصنيف الجديد… ثم Enter"
        />
        <button onClick={add} className="btn-primary !py-2.5">إضافة</button>
      </div>

      {loading ? (
        <Spinner />
      ) : cats.length === 0 ? (
        <EmptyState title="لا توجد تصنيفات بعد" />
      ) : (
        <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
          {cats.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              {editing === c.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input max-w-xs" autoFocus />
                  <button onClick={() => rename(c.id)} className="btn-primary !py-2 text-xs">حفظ</button>
                  <button onClick={() => setEditing(null)} className="btn-ghost !py-2 text-xs">إلغاء</button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{c.name}</span>
                    <span className="mr-3 text-xs text-zinc-400" dir="ltr">/{c.slug}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="chip">{c.count} مقال</span>
                    <a href={`/category/${c.slug}`} target="_blank" rel="noopener" className="btn-ghost !px-2.5 !py-1.5 text-[11px]">عرض</a>
                    <button onClick={() => { setEditing(c.id); setEditName(c.name); }} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">تعديل</button>
                    <button onClick={() => remove(c)} className="btn bg-red-50 !px-2.5 !py-1.5 text-[11px] text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400">حذف</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
