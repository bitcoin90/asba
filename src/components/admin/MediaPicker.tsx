"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchJson, Spinner } from "./adminui";
import { uploadImage, type UploadResult } from "./media";

export interface PickedMedia {
  id: number | null;
  url: string;
}

interface MediaItem {
  id: number;
  filename: string;
  mime: string;
  size: number;
  width: number;
  height: number;
}

export default function MediaPicker({
  open,
  onClose,
  onPick,
  allowUrl = true,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (m: PickedMedia) => void;
  allowUrl?: boolean;
}) {
  const [tab, setTab] = useState<"library" | "url">("library");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await fetchJson<{ media: MediaItem[] }>("/api/admin/media");
      setItems(json.media);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleFiles(files: FileList | File[]) {
    setError("");
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        await uploadImage(f);
      }
      await load();
    } catch (e: any) {
      setError(e.message || "فشل الرفع");
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="card flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="اختيار صورة"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white">اختيار صورة</h3>
          <div className="flex items-center gap-2">
            {allowUrl && (
              <button
                onClick={() => setTab(tab === "library" ? "url" : "library")}
                className="btn-ghost !py-1.5 text-xs"
              >
                {tab === "library" ? "استخدام رابط" : "المكتبة"}
              </button>
            )}
            <button onClick={onClose} className="text-zinc-400 hover:text-red-500" aria-label="إغلاق">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {tab === "url" ? (
          <div className="p-6">
            <label className="label">رابط الصورة المباشر</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input"
              placeholder="https://example.com/image.jpg"
              dir="ltr"
            />
            <button
              onClick={() => {
                if (/^https?:\/\//.test(url.trim())) {
                  onPick({ id: null, url: url.trim() });
                  onClose();
                } else setError("أدخل رابطًا صحيحًا يبدأ بـ http");
              }}
              className="btn-primary mt-4 w-full"
            >
              استخدام الرابط
            </button>
            {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
          </div>
        ) : (
          <>
            <div className="p-4">
              <div
                ref={dragRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
                }}
                className="flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-zinc-300 p-4 dark:border-zinc-700"
              >
                <p className="text-sm text-zinc-500">اسحب الصور هنا أو</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                <button onClick={() => inputRef.current?.click()} className="btn-primary !py-2 text-xs">
                  {uploading ? "جارٍ الرفع…" : "اختر صورًا"}
                </button>
              </div>
              {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
            </div>
            <div className="flex-1 overflow-y-auto border-t border-zinc-200 p-4 dark:border-zinc-800">
              {loading ? (
                <Spinner />
              ) : items.length === 0 ? (
                <p className="py-10 text-center text-sm text-zinc-500">المكتبة فارغة — ارفع أول صورة لك.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {items.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onPick({ id: m.id, url: `/api/media/${m.id}` });
                        onClose();
                      }}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 hover:border-[var(--brand)] dark:border-zinc-700"
                      title={m.filename}
                    >
                      <img src={`/api/media/${m.id}`} alt={m.filename} className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { type UploadResult };
