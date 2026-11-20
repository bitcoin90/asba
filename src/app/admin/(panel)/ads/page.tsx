"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson, PageHeader, Spinner, StatusBanner } from "@/components/admin/adminui";
import { AD_PLACEMENTS } from "@/lib/types";

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await fetchJson<{ ads: AdRow[] }>("/api/admin/ads");
      const map: Record<string, { code: string; enabled: boolean }> = {};
      for (const key of Object.keys(AD_PLACEMENTS)) {
        const row = json.ads.find((a) => a.placement === key);
        map[key] = { code: row?.code || "", enabled: !!row?.enabled };
      }
      setAds(map);
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

      <div className="sticky bottom-4 mt-6">
        <button onClick={save} disabled={saving} className="btn-primary mx-auto flex w-full max-w-md justify-center shadow-soft">
          {saving ? "جارٍ الحفظ…" : "حفظ كل الإعلانات"}
        </button>
      </div>
    </>
  );
}
