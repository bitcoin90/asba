"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchJson, EmptyState, PageHeader, Spinner, StatusBanner } from "@/components/admin/adminui";
import { uploadImage } from "@/components/admin/media";

interface MediaItem {
  id: number;
  filename: string;
  mime: string;
  size: number;
  width: number;
  height: number;
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });
  const [copied, setCopied] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await fetchJson<{ media: MediaItem[] }>("/api/admin/media");
      setItems(json.media);
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFiles(files: FileList | File[]) {
    setStatus({ type: "", text: "" });
    setUploading(true);
    let ok = 0;
    try {
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        await uploadImage(f);
        ok++;
      }
      setStatus({ type: "ok", text: `تم رفع ${ok} صورة — تم تصغيرها وضغطها تلقائيًا لتسريع الموقع` });
      await load();
    } catch (e: any) {
      setStatus({ type: "error", text: e.message || "فشل الرفع" });
    } finally {
      setUploading(false);
    }
  }

  async function copyLink(m: MediaItem) {
    const url = `${window.location.origin}/api/media/${m.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(m.id);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  }

  async function remove(m: MediaItem) {
    if (!confirm(`حذف الصورة «${m.filename}» نهائيًا؟ إن كانت غلافًا لمقال أو مدرجة داخل محتوى ما، سيختفي مكانها.`)) return;
    try {
      await fetchJson(`/api/admin/media/${m.id}`, { method: "DELETE" });
      setStatus({ type: "ok", text: "تم حذف الصورة" });
      await load();
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  return (
    <>
      <PageHeader
        title="مكتبة الوسائط"
        desc="ارفع صورك مرة واحدة وأعد استخدامها في أي مقال. تُصغَّر الصور تلقائيًا بحد أقصى 1600px للحفاظ على سرعة المدونة."
        action={
          <div>
            <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            <button onClick={() => inputRef.current?.click()} className="btn-primary" disabled={uploading}>
              {uploading ? "جارٍ الرفع…" : "رفع صور"}
            </button>
          </div>
        }
      />
      <StatusBanner status={status} />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
      >
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title="المكتبة فارغة" desc="اسحب الصور إلى هنا أو اضغط «رفع صور» للبدء." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((m) => (
              <div key={m.id} className="card group overflow-hidden">
                <div className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img src={`/api/media/${m.id}`} alt={m.filename} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-bold text-zinc-700 dark:text-zinc-300" title={m.filename}>
                    {m.filename}
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-400" dir="ltr">
                    {m.width}×{m.height} · {(m.size / 1024).toFixed(0)}KB
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <button onClick={() => copyLink(m)} className="btn-ghost flex-1 !px-2 !py-1.5 text-[11px]">
                      {copied === m.id ? "تم النسخ ✓" : "نسخ الرابط"}
                    </button>
                    <button onClick={() => remove(m)} className="btn flex-1 bg-red-50 !px-2 !py-1.5 text-[11px] text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400" aria-label={`حذف ${m.filename}`}>
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
