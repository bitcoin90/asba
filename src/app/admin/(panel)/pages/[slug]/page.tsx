"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RichEditor from "@/components/admin/RichEditor";
import MediaPicker, { type PickedMedia } from "@/components/admin/MediaPicker";
import { fetchJson, PageHeader, Spinner, StatusBanner } from "@/components/admin/adminui";

export default function EditStaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    fetchJson<{ page: { title: string; content: string } }>(`/api/admin/pages/${slug}`)
      .then((j) => {
        setTitle(j.page.title);
        setContent(j.page.content);
      })
      .catch((e) => setStatus({ type: "error", text: e.message }))
      .finally(() => setLoading(false));
  }, [slug]);

  function onPicked(m: PickedMedia) {
    window.dispatchEvent(new CustomEvent("asba-insert-image", { detail: { url: m.url } }));
  }

  async function save() {
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      await fetchJson(`/api/admin/pages/${slug}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      setStatus({ type: "ok", text: "تم حفظ الصفحة وتحديثها على الموقع فورًا" });
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/pages" className="btn-ghost !px-3 !py-2 text-xs">← الصفحات</Link>
          <h1 className="text-xl font-black text-zinc-900 dark:text-white">تعديل الصفحة</h1>
          <span className="text-xs text-zinc-400" dir="ltr">/page/{slug}</span>
        </div>
        <a href={`/page/${slug}`} target="_blank" rel="noopener" className="btn-ghost !px-3 !py-2 text-xs">عرض الصفحة ↗</a>
      </div>

      <StatusBanner status={status} />

      <div className="card p-5 sm:p-7">
        <div className="mb-5">
          <label className="label">عنوان الصفحة</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input !text-lg !font-bold" />
        </div>
        <label className="label">المحتوى</label>
        <RichEditor value={content} onChange={setContent} onImagePicker={() => setPickerOpen(true)} />
        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "جارٍ الحفظ…" : "حفظ التعديلات"}
          </button>
          <span className="text-xs text-zinc-400">التعديلات تظهر على الموقع مباشرة بعد الحفظ.</span>
        </div>
      </div>

      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={onPicked} />
    </div>
  );
}
