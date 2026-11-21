"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

interface NavItem {
  href: string;
  label: string;
}

export default function Header({
  siteName,
  logoUrl,
  navItems,
}: {
  siteName: string;
  logoUrl?: string;
  navItems: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term.length >= 2) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-200/70 bg-white/85 backdrop-blur-lg dark:border-zinc-800/70 dark:bg-zinc-950/85"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="الصفحة الرئيسية">
          {logoUrl ? (
            <span className="inline-flex items-center gap-2">
              <img src={logoUrl} alt={siteName} className="h-9 w-9 rounded-xl object-cover" />
              <span className="text-xl font-extrabold text-zinc-900 dark:text-white">{siteName}</span>
            </span>
          ) : (
            <Logo name={siteName} />
          )}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "text-[var(--brand)]"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <form onSubmit={submitSearch} className="hidden md:block" role="search">
            <div className="relative">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث في المدونة…"
                aria-label="بحث"
                className="input h-10 w-44 !py-0 pr-10 text-xs xl:w-56"
              />
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </form>

          <ThemeToggle />

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="القائمة"
            aria-expanded={open}
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* قائمة الهاتف */}
      <div
        className={`overflow-hidden border-t border-zinc-200/60 bg-white/95 backdrop-blur-lg transition-all duration-300 dark:border-zinc-800/60 dark:bg-zinc-950/95 lg:hidden ${
          open ? "max-h-96" : "max-h-0 border-t-0"
        }`}
      >
        <nav className="space-y-1 px-4 py-3" aria-label="قائمة الهاتف">
          <form onSubmit={submitSearch} className="pb-2" role="search">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث في المدونة…"
              aria-label="بحث"
              className="input h-10"
            />
          </form>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* بحث موسع للشاشات المتوسطة */}
      {searchOpen && (
        <div className="border-t border-zinc-200/60 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
          <form onSubmit={submitSearch} role="search">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث في المدونة…"
              className="input h-10"
              autoFocus
            />
          </form>
        </div>
      )}
    </header>
  );
}
