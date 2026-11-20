"use client";

import { useEffect, useState } from "react";

// أدوات مشتركة للوححة التحكم
export async function fetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `خطأ ${res.status}`);
  return json as T;
}

export function StatusBanner({ status }: { status: { type: "ok" | "error" | ""; text: string } }) {
  if (!status.type) return null;
  return (
    <div
      className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
        status.type === "ok"
          ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "border border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400"
      }`}
      role="status"
    >
      {status.text}
    </div>
  );
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white">{title}</h1>
        {desc && <p className="mt-1 text-sm text-zinc-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label = "جارٍ التحميل…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-zinc-500">
      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

export function EmptyState({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="card p-10 text-center">
      <p className="font-bold text-zinc-700 dark:text-zinc-300">{title}</p>
      {desc && <p className="mt-2 text-sm text-zinc-500">{desc}</p>}
    </div>
  );
}

export function useUnsavedGuard(dirty: boolean) {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  return () => setMsg("");
}
