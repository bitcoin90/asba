"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          subject: data.get("subject"),
          message: data.get("message"),
          website: data.get("website"), // فخ للسبام — يجب أن يبقى فارغًا
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setStatus("done");
        setMsg(json.message || "تم إرسال رسالتك بنجاح، شكرًا لتواصلك!");
        form.reset();
      } else {
        setStatus("error");
        setMsg(json.error || "تعذر إرسال الرسالة، حاول مرة أخرى.");
      }
    } catch {
      setStatus("error");
      setMsg("تعذر الاتصال بالخادم، حاول مرة أخرى.");
    }
  }

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="label">الاسم</label>
          <input id="cf-name" name="name" required minLength={2} maxLength={100} className="input" placeholder="اسمك الكريم" />
        </div>
        <div>
          <label htmlFor="cf-email" className="label">البريد الإلكتروني</label>
          <input id="cf-email" name="email" type="email" required className="input" placeholder="example@mail.com" />
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="cf-subject" className="label">الموضوع</label>
        <input id="cf-subject" name="subject" maxLength={150} className="input" placeholder="عنوان رسالتك" />
      </div>
      <div className="mt-4">
        <label htmlFor="cf-message" className="label">الرسالة</label>
        <textarea id="cf-message" name="message" required minLength={5} maxLength={5000} rows={6} className="input resize-y" placeholder="اكتب رسالتك هنا…" />
      </div>
      {/* حقل مخفي لصد البريد المزعج */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute opacity-0 pointer-events-none h-0 w-0" aria-hidden="true" />

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={status === "sending"} className="btn-primary">
          {status === "sending" ? "جارٍ الإرسال…" : "إرسال الرسالة"}
        </button>
        {status === "done" && <p className="text-sm font-semibold text-emerald-600">{msg}</p>}
        {status === "error" && <p className="text-sm font-semibold text-red-600">{msg}</p>}
      </div>
    </form>
  );
}
