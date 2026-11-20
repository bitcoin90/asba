import Link from "next/link";
import Logo from "./Logo";
import type { CategoryRow } from "@/lib/types";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";

const SOCIALS: { key: string; label: string; icon: string }[] = [
  {
    key: "social_x",
    label: "X",
    icon: "M18.9 1.2h3.7l-8.1 9.3L24 22.8h-7.5l-5.9-7.7-6.7 7.7H.2l8.7-9.9L0 1.2h7.7l5.3 7 6-7zm-1.3 19.4h2L6.6 3.3h-2.2l13.2 17.3z",
  },
  {
    key: "social_facebook",
    label: "Facebook",
    icon: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.8V24C19.62 23.09 24 18.1 24 12.07z",
  },
  {
    key: "social_instagram",
    label: "Instagram",
    icon: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12c0-3.2.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.18 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zm0 10.15A4 4 0 1 1 16 12a4 4 0 0 1-4 4zm6.4-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z",
  },
  {
    key: "social_youtube",
    label: "YouTube",
    icon: "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.55 15.57V8.43L15.82 12z",
  },
  {
    key: "social_telegram",
    label: "Telegram",
    icon: "M11.94 0A12 12 0 1 0 24 12 12 12 0 0 0 11.94 0zm5.87 8.16-1.97 9.3c-.15.66-.54.82-1.09.51l-3-2.21-1.45 1.4a.75.75 0 0 1-.66.2l.51-3.05 5.56-5.02c.24-.21-.05-.33-.37-.12l-6.87 4.33-2.96-.93c-.64-.2-.65-.64.14-.95l11.57-4.46c.53-.24 1.05.13.87.9z",
  },
  {
    key: "social_github",
    label: "GitHub",
    icon: "M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.7.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z",
  },
  {
    key: "social_linkedin",
    label: "LinkedIn",
    icon: "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.4v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56zM22.22 0H1.77A1.75 1.75 0 0 0 0 1.73v20.54A1.75 1.75 0 0 0 1.77 24h20.45A1.76 1.76 0 0 0 24 22.27V1.73A1.76 1.76 0 0 0 22.22 0z",
  },
];

export default function Footer({
  settings,
  categories,
  pages,
}: {
  settings: SiteSettings;
  categories: CategoryRow[];
  pages: { slug: string; title: string }[];
}) {
  const s = settings || DEFAULT_SETTINGS;
  const socials = SOCIALS.filter((soc) => s[soc.key]);
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo name={s.site_name} />
          <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            {s.site_tagline}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-zinc-900 dark:text-white">روابط سريعة</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="text-zinc-600 transition-colors hover:text-[var(--brand)] dark:text-zinc-400" href="/">الرئيسية</Link></li>
            <li><Link className="text-zinc-600 transition-colors hover:text-[var(--brand)] dark:text-zinc-400" href="/posts">جميع المقالات</Link></li>
            {pages.map((p) => (
              <li key={p.slug}>
                <Link className="text-zinc-600 transition-colors hover:text-[var(--brand)] dark:text-zinc-400" href={`/page/${p.slug}`}>
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-zinc-900 dark:text-white">الأقسام</h3>
          <ul className="space-y-2.5 text-sm">
            {categories.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link className="text-zinc-600 transition-colors hover:text-[var(--brand)] dark:text-zinc-400" href={`/category/${c.slug}`}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-zinc-900 dark:text-white">تابعنا</h3>
          {socials.length ? (
            <div className="flex flex-wrap gap-2">
              {socials.map((soc) => (
                <a
                  key={soc.key}
                  href={s[soc.key] as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={soc.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] dark:border-zinc-800 dark:text-zinc-400"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={soc.icon} />
                  </svg>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">أضف روابط حساباتك من لوحة التحكم ← الإعدادات.</p>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-200 py-5 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        {s.footer_text}
      </div>
    </footer>
  );
}
