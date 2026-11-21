"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson, EmptyState, PageHeader, Spinner, StatusBanner } from "@/components/admin/adminui";
import { fmtDateTime } from "@/lib/utils";

interface Msg {
  id: number;
  name: string;
  email: string;
  subject: string;
  body: string;
  is_read: number;
  created_at: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: "ok" | "error" | ""; text: string }>({ type: "", text: "" });
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await fetchJson<{ messages: Msg[] }>("/api/admin/messages");
      setMessages(json.messages);
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleRead(m: Msg) {
    try {
      await fetchJson(`/api/admin/messages/${m.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_read: !m.is_read }),
      });
      await load();
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  async function remove(m: Msg) {
    if (!confirm(`حذف رسالة «${m.subject || m.name}»؟`)) return;
    try {
      await fetchJson(`/api/admin/messages/${m.id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setStatus({ type: "error", text: e.message });
    }
  }

  return (
    <>
      <PageHeader title="رسائل الزوار" desc="الرسائل المرسلة من صفحة «اتصل بنا» تظهر هنا." />
      <StatusBanner status={status} />

      {loading ? (
        <Spinner />
      ) : messages.length === 0 ? (
        <EmptyState title="لا توجد رسائل بعد" desc="عندما يرسل زائر رسالة عبر صفحة اتصل بنا ستظهر هنا." />
      ) : (
        <div className="card divide-y divide-zinc-100 dark:divide-zinc-800">
          {messages.map((m) => (
            <div key={m.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setOpenId(openId === m.id ? null : m.id)}
                  className="flex flex-1 items-center gap-3 text-right"
                >
                  {!m.is_read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--brand)]" />}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${m.is_read ? "font-semibold text-zinc-600 dark:text-zinc-400" : "font-bold text-zinc-900 dark:text-white"}`}>
                      {m.subject || "(بدون موضوع)"} — {m.name}
                    </p>
                    <p className="text-xs text-zinc-400" dir="ltr">{m.email}</p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">{fmtDateTime(m.created_at)}</span>
                  <a href={`mailto:${m.email}`} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">رد</a>
                  <button onClick={() => toggleRead(m)} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">
                    {m.is_read ? "تعليم كغير مقروءة" : "تعليم كمقروءة"}
                  </button>
                  <button onClick={() => remove(m)} className="btn bg-red-50 !px-2.5 !py-1.5 text-[11px] text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400">حذف</button>
                </div>
              </div>
              {openId === m.id && (
                <div className="mt-3 rounded-xl bg-zinc-50 p-4 text-sm leading-7 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                  {m.body}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
