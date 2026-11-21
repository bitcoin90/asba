"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson, PageHeader, Spinner, StatusBanner } from "@/components/admin/adminui";
import { AD_PLACEMENTS } from "@/lib/types";
import type { RootFileRow } from "@/lib/rootFiles";

interface AdRow {
  id: number;
  placement: string;
  code: string;
  enabled: number;
}

export default function AdsPage() {
  const [ads, setAds] = useState<Record<string, { code: string; enabled: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });
  const [headCode, setHeadCode] = useState("");
  const [savingHead, setSavingHead] = useState(false);
  const [headStatus, setHeadStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });
  const [files, setFiles] = useState<RootFileRow[]>([]);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [savingFile, setSavingFile] = useState(false);
  const [fileStatus, setFileStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [json, settingsJson, filesJson] = await Promise.all([
        fetchJson<{ ads: AdRow[] }>("/api/admin/ads"),
        fetchJson<{ settings: Record<string, string> }>("/api/admin/settings"),
        fetchJson<{ files: RootFileRow[] }>("/api/admin/root-files"),
      ]);
      const map: Record<string, { code: string; enabled: boolean }> = {};
      for (const key of Object.keys(AD_PLACEMENTS)) {
        const row = json.ads.find((a) => a.placement === key);
        map[key] = { code: row?.code || "", enabled: !!row?.enabled };
      }
      setAds(map);
      setHeadCode(settingsJson.settings?.head_code || "");
      setFiles(filesJson.files || []);
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setStatus({ type: "", text: "" });
    try {
      await fetchJson("/api/admin/ads", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ads: Object.entries(ads).map(([placement, v]) => ({
            placement,
            code: v.code,
            enabled: v.enabled,
          })),
        }),
      });
      setStatus({ type: "ok", text: "تم حفظ الإعلانات — التغييرات ظاهرة على الموقع فورًا" });
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function saveHeadCode() {
    setSavingHead(true);
    setHeadStatus({ type: "", text: "" });
    try {
      await fetchJson("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings: { head_code: headCode } }),
      });
      setHeadStatus({ type: "ok", text: "تم الحفظ — الكود ظاهر الآن في <head> لكل صفحات الموقع" });
    } catch (e: any) {
      setHeadStatus({ type: "error", text: e.message });
    } finally {
      setSavingHead(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 100_000) {
      setFileStatus({ type: "error", text: "الملف أكبر من الحد المسموح (100KB)" });
      return;
    }
    const text = await f.text();
    setNewName(f.name);
    setNewContent(text);
    setFileStatus({ type: "", text: "" });
  }

  async function saveRootFile() {
    setSavingFile(true);
    setFileStatus({ type: "", text: "" });
    try {
      const res = await fetchJson<{ ok: boolean; url: string }>("/api/admin/root-files", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), content: newContent }),
      });
      setFileStatus({ type: "ok", text: `تم الحفظ — الملف متاح الآن على الرابط: ${res.url}` });
      const filesJson = await fetchJson<{ files: RootFileRow[] }>("/api/admin/root-files");
      setFiles(filesJson.files || []);
    } catch (e: any) {
      setFileStatus({ type: "error", text: e.message });
    } finally {
      setSavingFile(false);
    }
  }

  async function removeRootFile(name: string) {
    if (!confirm(`حذف الملف ${name} من جذر الموقع؟`)) return;
    try {
      await fetchJson(`/api/admin/root-files?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      setFiles((s) => s.filter((f) => f.name !== name));
    } catch (e: any) {
      setFileStatus({ type: "error", text: e.message });
    }
  }

  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader
        title="الإعلانات"
        desc="ألصق كود الإعلان في المساحة المناسبة وشغّلها. تدعم كل الشبكات مثل Google AdSense — انسخ كود <ins> والسكربت معًا."
      />
      <StatusBanner status={status} />

      <div className="grid gap-5 lg:grid-cols-2">
        {Object.entries(AD_PLACEMENTS).map(([key, meta]) => (
          <div key={key} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white">{meta.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{meta.desc}</p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={ads[key]?.enabled || false}
                  onChange={(e) => setAds((s) => ({ ...s, [key]: { ...(s[key] || { code: "" }), enabled: e.target.checked } }))}
                  className="h-4 w-4"
                />
                {ads[key]?.enabled ? "مُفعّلة" : "موقوفة"}
              </label>
            </div>
            <textarea
              dir="ltr"
              rows={5}
              value={ads[key]?.code || ""}
              onChange={(e) => setAds((s) => ({ ...s, [key]: { ...(s[key] || { enabled: false }), code: e.target.value } }))}
              className="input font-mono text-xs"
              placeholder='<script async src="https://pagead2.googlesyndication.com/..."></script>'
            />
          </div>
        ))}
      </div>

      {/* كود head المخصص */}
      <div className="card mt-6 p-5">
        <h3 className="font-bold text-zinc-900 dark:text-white">
          كود مخصص بين <span dir="ltr" className="font-mono">&lt;head&gt;&lt;/head&gt;</span>
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          يُحقن في رأس كل صفحات الموقع تلقائيًا (الرئيسية، المقالات، الصفحات) — ضع هنا وسم التحقق مثل
          <code dir="ltr" className="mx-1 font-mono">meta google-adsense-account</code>
          أو سكربت شبكة الإعلانات.
        </p>
        <textarea
          dir="ltr"
          rows={6}
          value={headCode}
          onChange={(e) => setHeadCode(e.target.value)}
          className="input mt-3 font-mono text-xs"
          placeholder={'<meta name="google-adsense-account" content="ca-pub-0000000000000000" />\n\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0000000000000000" crossorigin="anonymous"></script>'}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={saveHeadCode} disabled={savingHead} className="btn-primary">
            {savingHead ? "جارٍ الحفظ…" : "حفظ كود الـ head"}
          </button>
          {headStatus.text && (
            <span className={`text-xs font-bold ${headStatus.type === "ok" ? "text-green-600" : "text-red-600"}`}>
              {headStatus.text}
            </span>
          )}
        </div>
      </div>

      {/* ملفات إثبات الملكية في جذر الموقع */}
      <div className="card mt-5 p-5">
        <h3 className="font-bold text-zinc-900 dark:text-white">ملفات إثبات ملكية النطاق — جذر الموقع</h3>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          ارفع ملف التحقق الذي تطلبه شبكات الإعلانات (مثل google1a2b3c.html أو ads.txt) ليُخدم مباشرة على
          <code dir="ltr" className="mx-1 font-mono">https://asba.pw/اسم-الملف</code>
          — اختر الملف من جهازك ليُملأ تلقائيًا أو الصق المحتوى يدويًا.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold">اسم الملف بالضبط كما طلبه شبكة الإعلانات</label>
            <input
              dir="ltr"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input font-mono text-xs"
              placeholder="google1a2b3c.html أو ads.txt"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">أو ارفع الملف من جهازك</label>
            <input
              type="file"
              accept=".html,.htm,.txt,.json,.xml,.js,.css,.svg,.md"
              onChange={onPickFile}
              className="input text-xs"
            />
          </div>
        </div>
        <textarea
          dir="ltr"
          rows={5}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="input mt-3 font-mono text-xs"
          placeholder="محتوى الملف — يُملأ تلقائيًا عند اختيار ملف من جهازك"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={saveRootFile} disabled={savingFile} className="btn-primary">
            {savingFile ? "جارٍ الحفظ…" : "حفظ الملف في جذر الموقع"}
          </button>
          {fileStatus.text && (
            <span className={`text-xs font-bold ${fileStatus.type === "ok" ? "text-green-600" : "text-red-600"}`}>
              {fileStatus.text}
            </span>
          )}
        </div>

        {files.length > 0 && (
          <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            <div className="pb-1 text-xs font-bold text-zinc-500">الملفات الحالية:</div>
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-2">
                <a
                  href={`/${f.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  /{f.name}
                </a>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-400">{(f.content.length / 1024).toFixed(1)} KB</span>
                  <button
                    onClick={() => removeRootFile(f.name)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-4 mt-6">
        <button onClick={save} disabled={saving} className="btn-primary mx-auto flex w-full max-w-md justify-center shadow-soft">
          {saving ? "جارٍ الحفظ…" : "حفظ كل الإعلانات"}
        </button>
      </div>
    </>
  );
}
