"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson, EmptyState, PageHeader, Spinner, StatusBanner } from "@/components/admin/adminui";

interface ShortLink {
  id: number;
  code: string;
  url: string;
  title: string;
  clicks: number;
  created_at: string;
  updated_at: string;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function ShortLinksPage() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [status, setStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await fetchJson<{ links: ShortLink[]; totalClicks: number }>("/api/admin/short-links");
      setLinks(json.links);
      setTotalClicks(json.totalClicks || 0);
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setUrl("");
    setCode("");
    setTitle("");
    setEditing(null);
  }

  async function save() {
    if (!url.trim()) {
      setStatus({ type: "error", text: "الرابط الأصلي مطلوب" });
      return;
    }
    try {
      if (editing) {
        await fetchJson("/api/admin/short-links", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: editing, url: url.trim(), code: code.trim(), title: title.trim() }),
        });
        setStatus({ type: "ok", text: "تم تحديث الرابط" });
      } else {
        await fetchJson("/api/admin/short-links", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: url.trim(), code: code.trim(), title: title.trim() }),
        });
        setStatus({ type: "ok", text: "تم إنشاء الرابط المختصر" });
      }
      resetForm();
      await load();
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  function startEdit(l: ShortLink) {
    setEditing(l.id);
    setUrl(l.url);
    setCode(l.code);
    setTitle(l.title);
    setStatus({ type: "", text: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(l: ShortLink) {
    const label = l.title || l.code;
    if (!confirm(`حذف الرابط المختصر «${label}»؟ لن يعمل الرابط القديم بعد الحذف.`)) return;
    try {
      await fetchJson(`/api/admin/short-links?id=${l.id}`, { method: "DELETE" });
      setStatus({ type: "ok", text: "تم حذف الرابط" });
      if (editing === l.id) resetForm();
      await load();
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  async function copyCode(l: ShortLink) {
    const full = `${window.location.origin}/s/${l.code}`;
    try {
      await navigator.clipboard.writeText(full);
      setStatus({ type: "ok", text: `تم نسخ الرابط: ${full}` });
    } catch {
      setStatus({ type: "error", text: `انسخ يدويًا: ${full}` });
    }
  }

  return (
    <>
      <PageHeader
        title="تقصير الروابط"
        desc="حوّل أي رابط طويل إلى رابط مختصر على دومين موقعك مثل asba.pw/s/عرض — مع عداد نقرات لكل رابط."
      />
      <StatusBanner status={status} />

      {/* نموذج الإنشاء / التعديل */}
      <div className="card mb-6 p-5">
        <h3 className="mb-4 text-sm font-bold text-zinc-700 dark:text-zinc-300">
          {editing ? "تعديل رابط مختصر" : "إضافة رابط مختصر جديد"}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-zinc-500">الرابط الأصلي *</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input w-full"
              dir="ltr"
              placeholder="https://example.com/very/long/link?q=123"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-zinc-500">الكود المختصر — اتركه فارغًا للتوليد التلقائي</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400" dir="ltr">/s/</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input flex-1"
                dir="ltr"
                placeholder="promo2026"
              />
            </div>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-xs font-bold text-zinc-500">عنوان وصفي (اختياري — يساعدك على تذكر الغرض)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="input w-full"
              placeholder="مثال: رابط الحملة الإعلانية على فيسبوك"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={save} className="btn-primary !py-2.5">
            {editing ? "حفظ التعديل" : "إنشاء الرابط المختصر"}
          </button>
          {editing && (
            <button onClick={resetForm} className="btn-ghost !py-2.5">
              إلغاء التعديل
            </button>
          )}
        </div>
      </div>

      {/* شريط الإحصاءات */}
      {!loading && links.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          <span className="chip !px-4 !py-2">{links.length} رابط مختصر</span>
          <span className="chip !px-4 !py-2">{totalClicks} نقرة إجمالًا</span>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : links.length === 0 ? (
        <EmptyState title="لا توجد روابط مختصرة بعد — أنشئ أول رابط من النموذج أعلاه" />
      ) : (
        <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
          {links.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200" dir="ltr">
                    /s/{l.code}
                  </span>
                  <button
                    onClick={() => copyCode(l)}
                    className="btn-ghost !px-2 !py-1 text-[11px]"
                    title="نسخ الرابط الكامل"
                  >
                    نسخ
                  </button>
                  <a
                    href={`/s/${l.code}`}
                    target="_blank"
                    rel="noopener"
                    className="btn-ghost !px-2 !py-1 text-[11px]"
                  >
                    تجربة
                  </a>
                </div>
                <div className="mt-1 truncate text-xs text-zinc-500" dir="ltr">
                  {l.url}
                </div>
                {l.title && <div className="mt-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400">{l.title}</div>}
                <div className="mt-1 text-[11px] text-zinc-400">أُنشئ في {fmtDate(l.created_at)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip">{l.clicks} نقرة</span>
                <button onClick={() => startEdit(l)} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">
                  تعديل
                </button>
                <button
                  onClick={() => remove(l)}
                  className="btn bg-red-50 !px-2.5 !py-1.5 text-[11px] text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
