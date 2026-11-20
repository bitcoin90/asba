"use client";

import { useEffect, useState } from "react";
import MediaPicker, { type PickedMedia } from "@/components/admin/MediaPicker";
import { fetchJson, PageHeader, Spinner, StatusBanner } from "@/components/admin/adminui";
import { ACCENTS } from "@/lib/utils";

const FIELDS: { key: string; label: string; placeholder?: string; textarea?: boolean; help?: string }[] = [
  { key: "site_name", label: "اسم المدونة" },
  { key: "site_tagline", label: "الشعار النصي (الجملة التعريفية)" },
  { key: "site_description", label: "وصف الموقع لمحركات البحث", textarea: true, help: "يظهر في نتائج Google ووسائل المشاركة (حتى 300 حرف)" },
  { key: "author_name", label: "اسم الكاتب / صاحب المدونة" },
  { key: "about_short", label: "نبذة قصيرة عنك (تظهر في الصفحة الرئيسية)", textarea: true },
  { key: "contact_email", label: "البريد الإلكتروني للتواصل", placeholder: "you@example.com" },
  { key: "footer_text", label: "نص التذييل" },
];

const SOCIALS: { key: string; label: string }[] = [
  { key: "social_x", label: "X (تويتر)" },
  { key: "social_facebook", label: "فيسبوك" },
  { key: "social_instagram", label: "إنستغرام" },
  { key: "social_youtube", label: "يوتيوب" },
  { key: "social_telegram", label: "تيليجرام" },
  { key: "social_github", label: "جيت هاب" },
  { key: "social_linkedin", label: "لينكد إن" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    fetchJson<{ settings: Record<string, string> }>("/api/admin/settings")
      .then((j) => setSettings(j.settings))
      .catch((e) => setStatus({ type: "error", text: e.message }))
      .finally(() => setLoading(false));
  }, []);

  function set(key: string, v: string) {
    setSettings((s) => ({ ...s, [key]: v }));
  }

  async function save() {
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      await fetchJson("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      setStatus({ type: "ok", text: "تم حفظ الإعدادات وتطبيقها على الموقع" });
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  const logoUrl = settings.logo_media_id ? `/api/media/${settings.logo_media_id}` : "";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="إعدادات المدونة" desc="اسم المدونة، الوصف، روابط التواصل، اللون المميز، والشعار." />
      <StatusBanner status={status} />

      <div className="card mb-6 p-5 sm:p-7">
        <h2 className="mb-4 font-bold text-zinc-900 dark:text-white">البيانات الأساسية</h2>
        <div className="grid gap-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              {f.textarea ? (
                <textarea
                  value={settings[f.key] || ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  rows={2}
                  className="input resize-y"
                />
              ) : (
                <input
                  value={settings[f.key] || ""}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="input"
                  placeholder={f.placeholder}
                />
              )}
              {f.help && <p className="mt-1 text-xs text-zinc-400">{f.help}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-6 p-5 sm:p-7">
        <h2 className="mb-4 font-bold text-zinc-900 dark:text-white">الشعار (Logo)</h2>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="الشعار" className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <span className="text-sm text-zinc-400">لا يوجد شعار مرفوع — سيُستخدم الشعار الافتراضي.</span>
          )}
          <button onClick={() => setPickerOpen(true)} className="btn-ghost !py-2 text-xs">
            {logoUrl ? "تغيير الشعار" : "اختيار شعار"}
          </button>
          {logoUrl && (
            <button onClick={() => set("logo_media_id", "")} className="text-xs font-semibold text-red-500">إزالة</button>
          )}
        </div>
      </div>

      <div className="card mb-6 p-5 sm:p-7">
        <h2 className="mb-4 font-bold text-zinc-900 dark:text-white">اللون المميز (الهوية البصرية)</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(ACCENTS).map(([hex, meta]) => (
            <button
              key={hex}
              onClick={() => set("theme_accent", hex)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                settings.theme_accent === hex
                  ? "border-[var(--brand)] bg-zinc-100 dark:bg-zinc-800"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700"
              }`}
            >
              <span className="h-5 w-5 rounded-full" style={{ backgroundImage: `linear-gradient(135deg, ${meta.a}, ${meta.b})` }} />
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card mb-6 p-5 sm:p-7">
        <h2 className="mb-4 font-bold text-zinc-900 dark:text-white">روابط التواصل الاجتماعي</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIALS.map((s) => (
            <div key={s.key}>
              <label className="label">{s.label}</label>
              <input
                dir="ltr"
                value={settings[s.key] || ""}
                onChange={(e) => set(s.key, e.target.value)}
                className="input"
                placeholder="https://…"
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-400">اتركه فارغًا لإخفاء الأيقونة من التذييل.</p>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full">
        {saving ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
      </button>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(m) => {
          if (m.id) set("logo_media_id", String(m.id));
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
