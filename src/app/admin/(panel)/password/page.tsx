"use client";

import { useState } from "react";
import { fetchJson, PageHeader, StatusBanner } from "@/components/admin/adminui";

export default function PasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "", text: "" });
    if (next !== confirm) {
      setStatus({ type: "error", text: "كلمة المرور الجديدة وتأكيدها غير متطابقين" });
      return;
    }
    if (next.length < 8) {
      setStatus({ type: "error", text: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
      return;
    }
    setSaving(true);
    try {
      await fetchJson("/api/admin/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      setStatus({ type: "ok", text: "تم تغيير كلمة المرور بنجاح — استخدمها في الدخول القادم" });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="تغيير كلمة المرور"
        desc="كلمة المرور تُشفَّر قبل الحفظ، ويتم التحقق منها من الخادم دائمًا."
      />
      <StatusBanner status={status} />

      <form onSubmit={submit} className="card p-5 sm:p-7">
        <div className="mb-4">
          <label className="label">كلمة المرور الحالية</label>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
            className="input"
          />
        </div>
        <div className="mb-4">
          <label className="label">كلمة المرور الجديدة (8 أحرف على الأقل)</label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
        </div>
        <div className="mb-6">
          <label className="label">تأكيد كلمة المرور الجديدة</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
          />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "جارٍ الحفظ…" : "تغيير كلمة المرور"}
        </button>
      </form>
    </div>
  );
}
