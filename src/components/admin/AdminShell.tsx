"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "@/components/public/Logo";

const NAV = [
  { href: "/admin", label: "الرئيسية", icon: "M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" },
  { href: "/admin/posts", label: "المقالات", icon: "M4 5h16M4 10h16M4 15h10M4 20h7" },
  { href: "/admin/posts/new", label: "مقال جديد", icon: "M12 5v14M5 12h14" },
  { href: "/admin/categories", label: "التصنيفات", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { href: "/admin/pages", label: "الصفحات الثابتة", icon: "M6 3h9l4 4v14H6zM15 3v4h4" },
  { href: "/admin/media", label: "مكتبة الوسائط", icon: "M3 5h18v14H3zM3 15l5-5 4 4 3-3 6 6" },
  { href: "/admin/ads", label: "الإعلانات", icon: "M3 12h4l6-5v10l-6-5H3zM17 8a6 6 0 0 1 0 8" },
  { href: "/admin/messages", label: "الرسائل", icon: "M3 6h18v12H3zM3 7l9 6 9-6" },
  { href: "/admin/settings", label: "الإعدادات", icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM3 12h2m14 0h2M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4" },
  { href: "/admin/password", label: "كلمة المرور", icon: "M6 10V8a6 6 0 0 1 12 0v2M4 10h16v10H4zM12 14v3" },
];

export default function AdminShell({
  children,
  username,
}: {
  children: React.ReactNode;
  username: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/admin/messages?count=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setUnread(j.unread))
      .catch(() => {});
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/") || (href !== "/admin/posts/new" && pathname.startsWith(href));

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* الشريط الجانبي */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 border-l border-zinc-200 bg-white transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-900 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-5 dark:border-zinc-800">
          <Link href="/admin">
            <Logo size="sm" />
          </Link>
          <button onClick={() => setOpen(false)} className="text-zinc-500 lg:hidden" aria-label="إغلاق القائمة">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <nav className="p-3" aria-label="قائمة لوحة التحكم">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "text-white"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
                style={active ? { backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-2))" } : undefined}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                {item.label}
                {item.href === "/admin/messages" && unread > 0 && (
                  <span className="mr-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <Link href="/" target="_blank" className="btn-ghost mb-2 w-full !py-2 text-xs">
            عرض الموقع ↗
          </Link>
          <button onClick={logout} className="btn w-full bg-zinc-100 !py-2 text-xs text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:text-zinc-300">
            تسجيل الخروج ({username})
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      {/* المحتوى */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 lg:px-8">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 lg:hidden"
            aria-label="فتح القائمة"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <p className="hidden text-sm font-bold text-zinc-500 lg:block">لوحة تحكم المدونة</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">{username}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundImage: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}>
              {username.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
