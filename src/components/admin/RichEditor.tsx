"use client";

import { useEffect, useRef, useState } from "react";
import "quill/dist/quill.snow.css";

let registered = false;

/** تسجيل بلوت صورة يدعم الخاصية style (لأحجام الصور داخل المقال) */
function registerImageBlot(Quill: any) {
  if (registered) return;
  const BaseImage = Quill.import("formats/image");
  class ImageBlot extends BaseImage {
    static formats(node: HTMLElement) {
      const base = super.formats ? super.formats(node) : {};
      return { ...base, style: node.getAttribute("style") || "" };
    }
    format(name: string, value: any) {
      if (name === "style") {
        if (value) {
          this.domNode.setAttribute("style", value);
        } else {
          this.domNode.removeAttribute("style");
        }
      } else {
        super.format(name, value);
      }
    }
  }
  Quill.register(ImageBlot, true);
  registered = true;
}

const SIZES = [
  { label: "25%", value: "25%" },
  { label: "50%", value: "50%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" },
];

export default function RichEditor({
  value,
  onChange,
  onImagePicker,
}: {
  value: string;
  onChange: (html: string) => void;
  onImagePicker: (cb: (url: string) => void) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const [imgPopover, setImgPopover] = useState<{ x: number; y: number; img: HTMLImageElement } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QuillMod = await import("quill");
      if (cancelled || !ref.current) return;
      const Quill = QuillMod.default;
      registerImageBlot(Quill);

      const q = new Quill(ref.current, {
        theme: "snow",
        placeholder: "اكتب محتوى المقال هنا… استخدم الأدوات أعلاه للتنسيق وإدراج الصور والروابط والفيديو.",
        modules: {
          toolbar: {
            container: [
              [{ header: [2, 3, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["blockquote", "code-block"],
              ["link", "image", "video"],
              [{ align: [] }],
              ["clean"],
            ],
            handlers: {
              image: () => {
                onImagePickerRef.current((url: string) => {
                  const range = q.getSelection(true);
                  const index = range ? range.index : q.getLength();
                  q.insertEmbed(index, "image", url, "user");
                  q.setSelection(index + 1, 0, "user");
                });
              },
              video: () => {
                const url = window.prompt("ألصق رابط الفيديو (YouTube / Vimeo):");
                if (url && /^https?:\/\//.test(url.trim())) {
                  const range = q.getSelection(true);
                  const index = range ? range.index : q.getLength();
                  q.insertEmbed(index, "video", url.trim(), "user");
                }
              },
            },
          },
        },
      });

      // تحميل المحتوى الأولي
      if (value) {
        try {
          (q as any).clipboard.dangerouslyPasteHTML(value, "user");
        } catch {
          q.clipboard.dangerouslyPasteHTML(value);
        }
      }

      q.on("text-change", () => {
        onChangeRef.current(q.root.innerHTML);
      });

      // نافذة أحجام الصور عند النقر على صورة
      q.root.addEventListener("click", (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target && target.tagName === "IMG") {
          const rect = (target as HTMLImageElement).getBoundingClientRect();
          setImgPopover({ x: rect.left + window.scrollX, y: rect.top + window.scrollY - 48, img: target as HTMLImageElement });
        } else {
          setImgPopover(null);
        }
      });

      quillRef.current = q;
      (q as any).__Quill = Quill;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const onImagePickerRef = useRef(onImagePicker);
  useEffect(() => {
    onImagePickerRef.current = onImagePicker;
  }, [onImagePicker]);

  function applySize(size: string) {
    const q = quillRef.current;
    if (!q || !imgPopover) return;
    const img = imgPopover.img;
    const style = `width:${size}`;
    try {
      const QuillClass = (q as any).__Quill;
      const blot: any = QuillClass?.find?.(img);
      if (blot && typeof blot.format === "function") {
        blot.format("style", style);
      }
    } catch {}
    // تطبيق مباشر على DOM كضمان إضافي
    img.setAttribute("style", style);
    img.removeAttribute("width");
    img.removeAttribute("height");
    setImgPopover(null);
  }

  function removeImage() {
    const img = imgPopover?.img;
    if (img) {
      img.remove();
      onChangeRef.current(quillRef.current.root.innerHTML);
    }
    setImgPopover(null);
  }

  // إدراج صورة من المُنتقي الخارجي
  useEffect(() => {
    const handler = (e: Event) => {
      const url = (e as CustomEvent).detail?.url;
      if (!url || !quillRef.current) return;
      const q = quillRef.current;
      const range = q.getSelection(true);
      const index = range ? range.index : q.getLength();
      q.insertEmbed(index, "image", url, "user");
      q.setSelection(index + 1, 0, "user");
    };
    window.addEventListener("asba-insert-image", handler);
    return () => window.removeEventListener("asba-insert-image", handler);
  }, []);

  useEffect(() => {
    if (!imgPopover) return;
    const close = () => setImgPopover(null);
    window.addEventListener("scroll", close, { once: true, passive: true });
    return () => window.removeEventListener("scroll", close);
  }, [imgPopover]);

  return (
    <div className="relative">
      <div ref={ref} className="rich-editor min-h-[400px]" />
      {imgPopover && (
        <div
          className="absolute z-50 flex items-center gap-1 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-soft dark:border-zinc-700 dark:bg-zinc-900"
          style={{ left: imgPopover.x - 60, top: imgPopover.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => applySize(s.value)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={removeImage}
            className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400"
          >
            حذف
          </button>
        </div>
      )}
    </div>
  );
}
