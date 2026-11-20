"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RichEditor from "./RichEditor";
import MediaPicker, { type PickedMedia } from "./MediaPicker";
import { fetchJson, StatusBanner } from "./adminui";

export interface EditorPost {
  id?: number;
  slug?: string;
  title: string;
  excerpt: string;
  content: string;
  cover_media_id: number | null;
  cover_url: string | null;
  category_id: number | null;
  tags: string[];
  status: "draft" | "published" | "scheduled";
  published_at: string | null;
  featured: boolean;
  seo_title: string;
  seo_description: string;
  og_media_id: number | null;
  created_at?: string;
  updated_at?: string;
  views?: number;
}

const EMPTY: EditorPost = {
  title: "",
  excerpt: "",
  content: "",
  cover_media_id: null,
  cover_url: null,
  category_id: null,
  tags: [],
  status: "draft",
  published_at: null,
  featured: false,
  seo_title: "",
  seo_description: "",
  og_media_id: null,
};

export default function PostEditor({
  initial,
  categories,
}: {
  initial: EditorPost | null;
  categories: { id: number; name: string; slug: string }[];
}) {
  const router = useRouter();
  const [post, setPost] = useState<EditorPost>(initial ? { ...initial } : { ...EMPTY });
  const [tagsText, setTagsText] = useState(initial?.tags?.join("، ") || "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });
  const [showSeo, setShowSeo] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const slugRef = useRef(initial?.slug || "");
  const pickerTarget = useRef<"cover" | "og" | "editor">("editor");

  const dirty = useMemo(() => JSON.stringify(post) !== JSON.stringify(initial || EMPTY), [post, initial]);

  useEffect(() => {
    slugRef.current = post.slug || "";
  }, [post.slug]);

  function set<K extends keyof EditorPost>(key: K, v: EditorPost[K]) {
    setPost((p) => ({ ...p, [key]: v }));
  }

  // توليد slug تلقائيًا من العنوان إن لم يعدّله المستخدم
  function autoSlug(title: string) {
    if (slugTouched) return;
    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^\u0621-\u064Aa-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    set("slug", slug);
  }

  function pickCover() {
    pickerTarget.current = "cover";
    setPickerOpen(true);
  }
  function pickOg() {
    pickerTarget.current = "og";
    setPickerOpen(true);
  }
  function pickForEditor() {
    pickerTarget.current = "editor";
    setPickerOpen(true);
  }

  function onPicked(m: PickedMedia) {
    const t = pickerTarget.current;
    if (t === "cover") {
      setPost((p) => ({ ...p, cover_media_id: m.id, cover_url: m.id ? null : m.url }));
    } else if (t === "og") {
      setPost((p) => ({ ...p, og_media_id: m.id }));
    } else {
      window.dispatchEvent(new CustomEvent("asba-insert-image", { detail: { url: m.url } }));
    }
  }

  async function save(as: EditorPost["status"]): Promise<void> {
    setStatus({ type: "", text: "" });

    const scheduledAt =
      as === "scheduled"
        ? (post.published_at ? new Date(post.published_at).toISOString() : "")
        : as === "published" && post.published_at
        ? new Date(post.published_at).toISOString()
        : null;

    const payload = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      cover_media_id: post.cover_media_id,
      cover_url: post.cover_url,
      category_id: post.category_id,
      tags: tagsText.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
      status: as,
      published_at:
        as === "scheduled"
          ? post.published_at
          : as === "published"
          ? post.published_at || scheduledAt || new Date().toISOString()
          : null,
      featured: post.featured,
      seo_title: post.seo_title,
      seo_description: post.seo_description,
      og_media_id: post.og_media_id,
    };

    if (!payload.title.trim()) {
      setStatus({ type: "error", text: "عنوان المقال مطلوب" });
      return;
    }
    if (as === "scheduled") {
      if (!payload.published_at || new Date(payload.published_at).getTime() <= Date.now()) {
        setStatus({ type: "error", text: "اختر تاريخًا ووقتًا مستقبليين للنشر المجدول" });
        return;
      }
    }

    setSaving(true);
    try {
      let id = post.id;
      if (id) {
        await fetchJson(`/api/admin/posts/${id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetchJson<{ id: number }>("/api/admin/posts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        id = res.id;
      }
      setStatus({
        type: "ok",
        text:
          as === "published"
            ? "تم النشر! المقال ظاهر الآن على المدونة."
            : as === "scheduled"
            ? "تمت الجدولة — سيظهر المقال تلقائيًا في موعده."
            : "تم حفظ المسودة.",
      });
      if (!post.id && id) {
        router.replace(`/admin/posts/${id}`);
        router.refresh();
      } else {
        setPost((p) => ({ ...p, status: as }));
        router.refresh();
      }
    } catch (e: any) {
      setStatus({ type: "error", text: e.message || "تعذر الحفظ" });
    } finally {
      setSaving(false);
    }
  }

  async function unpublish() {
    if (!post.id) return;
    try {
      await fetchJson(`/api/admin/posts/${post.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payloadOf(post), status: "draft" }),
      });
      setStatus({ type: "ok", text: "تم تحويل المقال إلى مسودة وإخفائه من المدونة" });
      setPost((p) => ({ ...p, status: "draft" }));
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  function payloadOf(p: EditorPost) {
    return {
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      cover_media_id: p.cover_media_id,
      cover_url: p.cover_url,
      category_id: p.category_id,
      tags: tagsText.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
      status: p.status,
      published_at: p.published_at,
      featured: p.featured,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      og_media_id: p.og_media_id,
    };
  }

  async function remove() {
    if (!post.id) return;
    if (!confirm(`حذف «${post.title}» نهائيًا؟ سيختفي من المدونة فورًا ولا يمكن استرجاعه.`)) return;
    try {
      await fetchJson(`/api/admin/posts/${post.id}`, { method: "DELETE" });
      router.push("/admin/posts");
      router.refresh();
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  const coverSrc =
    post.cover_media_id
      ? `/api/media/${post.cover_media_id}`
      : post.cover_url || "";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/posts" className="btn-ghost !px-3 !py-2 text-xs">← المقالات</Link>
          <h1 className="text-xl font-black text-zinc-900 dark:text-white">
            {post.id ? "تعديل المقال" : "مقال جديد"}
          </h1>
          <StatusBadge status={post.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {post.slug && (
            <a href={`/post/${post.slug}`} target="_blank" rel="noopener" className="btn-ghost !px-3 !py-2 text-xs">
              معاينة ↗
            </a>
          )}
          {post.status === "published" ? (
            <button onClick={unpublish} disabled={saving} className="btn-ghost !px-3 !py-2 text-xs">
              إلغاء النشر
            </button>
          ) : null}
          <button onClick={remove} disabled={saving} className="btn bg-red-50 !px-3 !py-2 text-xs text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400">
            حذف
          </button>
        </div>
      </div>

      <StatusBanner status={status} />

      <div className="card p-5 sm:p-7">
        {/* العنوان */}
        <div className="mb-4">
          <label className="label">عنوان المقال *</label>
          <input
            value={post.title}
            onChange={(e) => {
              set("title", e.target.value);
              autoSlug(e.target.value);
            }}
            className="input !text-lg !font-bold"
            placeholder="اكتب عنوانًا واضحًا وجذابًا…"
          />
        </div>

        {/* الرابط */}
        <div className="mb-4">
          <label className="label">رابط المقال (slug) — اتركه كما هو أو عدّله</label>
          <div className="flex items-center gap-2" dir="ltr">
            <span className="text-xs text-zinc-400">/post/</span>
            <input
              value={post.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              className="input flex-1"
              placeholder="article-url"
            />
          </div>
        </div>

        {/* المقتطف */}
        <div className="mb-4">
          <label className="label">مقتطف قصير (يظهر في القوائم ونتائج البحث)</label>
          <textarea
            value={post.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            className="input resize-y"
            placeholder="ملخص من سطر أو سطرين… (يُولَّد تلقائيًا من المحتوى إن تُرك فارغًا)"
          />
        </div>

        {/* الصورة الرئيسية */}
        <div className="mb-5">
          <label className="label">الصورة الرئيسية (الغلاف)</label>
          <div className="flex items-center gap-4">
            {coverSrc && (
              <img src={coverSrc} alt="الغلاف" className="h-20 w-32 rounded-xl object-cover" />
            )}
            <button onClick={pickCover} className="btn-ghost !py-2 text-xs">
              {coverSrc ? "تغيير الصورة" : "اختيار صورة"}
            </button>
            {coverSrc && (
              <button onClick={() => setPost((p) => ({ ...p, cover_media_id: null, cover_url: null }))} className="text-xs font-semibold text-red-500 hover:text-red-600">
                إزالة
              </button>
            )}
          </div>
        </div>

        {/* المحرر */}
        <div className="mb-2">
          <label className="label">محتوى المقال</label>
          <RichEditor value={post.content} onChange={(html) => set("content", html)} onImagePicker={pickForEditor} />
          <p className="mt-2 text-xs text-zinc-400">
            اضغط على أي صورة داخل المحتوى للتحكم في حجمها أو حذفها. استخدم أيقونة الصورة لإدراج صور من المكتبة أو رابط مباشر.
          </p>
        </div>
      </div>

      {/* بطاقة النشر */}
      <div className="card mt-6 p-5 sm:p-7">
        <h2 className="mb-4 font-bold text-zinc-900 dark:text-white">النشر والتصنيف</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">التصنيف</label>
            <select
              value={post.category_id ?? ""}
              onChange={(e) => set("category_id", e.target.value ? parseInt(e.target.value, 10) : null)}
              className="input"
            >
              <option value="">بدون تصنيف</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">الوسوم (افصل بينها بفاصلة)</label>
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              className="input"
              placeholder="ذكاء اصطناعي، شروحات"
            />
          </div>
          <div>
            <label className="label">الحالة</label>
            <div className="flex items-center gap-2">
              <span className="chip">{post.status === "published" ? "منشور" : post.status === "scheduled" ? "مجدول" : "مسودة"}</span>
              {initial?.views != null && <span className="text-xs text-zinc-400">{initial.views} مشاهدة</span>}
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={post.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 rounded"
              />
              مقال مميز (يظهر في قسم المميزة بالصفحة الرئيسية)
            </label>
          </div>
        </div>

        {post.status === "scheduled" && (
          <div className="mt-4">
            <label className="label">موعد النشر المجدول</label>
            <input
              type="datetime-local"
              value={post.published_at ? toLocalInput(post.published_at) : ""}
              onChange={(e) => set("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
              className="input"
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <button onClick={() => save("draft")} disabled={saving} className="btn-ghost">
            {saving ? "جارٍ الحفظ…" : "حفظ كمسودة"}
          </button>
          <button onClick={() => save("published")} disabled={saving} className="btn-primary">
            {post.id ? "تحديث ونشر" : "نشر الآن"}
          </button>
          <button
            onClick={() => {
              if (post.status !== "scheduled" && !post.published_at) {
                set("published_at", new Date(Date.now() + 864e5).toISOString());
              }
              set("status", "scheduled");
              setTimeout(() => save("scheduled"), 50);
            }}
            disabled={saving}
            className="btn-ghost"
          >
            جدولة النشر
          </button>
          {post.status === "scheduled" && (
            <div className="w-full">
              <label className="label mt-2">موعد النشر</label>
              <input
                type="datetime-local"
                value={post.published_at ? toLocalInput(post.published_at) : ""}
                onChange={(e) => set("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="input max-w-xs"
              />
            </div>
          )}
        </div>
        {initial?.created_at && (
          <p className="mt-4 text-xs text-zinc-400">
            أُنشئ في {new Date(initial.created_at).toLocaleString("ar-u-nu-latn")} · آخر تعديل:{" "}
            {new Date(initial.updated_at || initial.created_at).toLocaleString("ar-u-nu-latn")}
          </p>
        )}
      </div>

      {/* SEO */}
      <div className="card mt-6 p-5 sm:p-7">
        <button
          onClick={() => setShowSeo(!showSeo)}
          className="flex w-full items-center justify-between font-bold text-zinc-900 dark:text-white"
        >
          إعدادات SEO ووسائل المشاركة
          <span className="text-xs text-zinc-400">{showSeo ? "إخفاء −" : "إظهار +"}</span>
        </button>
        {showSeo && (
          <div className="mt-5 grid gap-4">
            <div>
              <label className="label">عنوان محركات البحث (يُستخدم بدل العنوان إن وُجد)</label>
              <input value={post.seo_title} onChange={(e) => set("seo_title", e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">وصف محركات البحث (حتى 300 حرف)</label>
              <textarea value={post.seo_description} onChange={(e) => set("seo_description", e.target.value)} rows={2} className="input resize-y" />
            </div>
            <div>
              <label className="label">صورة مخصصة للمشاركة (OG Image)</label>
              <div className="flex items-center gap-3">
                {post.og_media_id && (
                  <img src={`/api/media/${post.og_media_id}`} alt="OG" className="h-16 w-24 rounded-lg object-cover" />
                )}
                <button onClick={pickOg} className="btn-ghost !py-2 text-xs">
                  {post.og_media_id ? "تغيير" : "اختيار صورة"}
                </button>
                {post.og_media_id && (
                  <button onClick={() => set("og_media_id", null)} className="text-xs font-semibold text-red-500">إزالة</button>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-400">إن لم تُحدد، ستُستخدم صورة الغلاف أو الصورة الافتراضية للمدونة.</p>
            </div>
          </div>
        )}
      </div>

      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={onPicked} />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    published: { label: "منشور", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
    draft: { label: "مسودة", cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
    scheduled: { label: "مجدول", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  };
  const s = map[status] || map.draft;
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
