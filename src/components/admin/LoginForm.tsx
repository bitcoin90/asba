"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/public/Logo";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(json.error || "تعذر تسجيل الدخول");
      }
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 dark:bg-zinc-950">
      <div className="card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <Logo size="lg" />
          <p className="mt-3 text-sm text-zinc-500">تسجيل الدخول إلى لوحة التحكم</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="mb-4">
            <label htmlFor="al-user" className="label">اسم المستخدم</label>
            <input
              id="al-user"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="input"
              placeholder="اسم المستخدم"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="al-pass" className="label">كلمة المرور</label>
            <div className="relative">
              <input
                id="al-pass"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="input pl-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {show ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
            {loading ? "جارٍ التحقق…" : "دخول"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          هذه المنطقة مخصصة لإدارة المدونة فقط.
          <br />
          <Link href="/" className="font-semibold text-zinc-500 hover:text-[var(--brand)]">
            ← العودة إلى الموقع
          </Link>
        </p>
      </div>
    </div>
  );
}
