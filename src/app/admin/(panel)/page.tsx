"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJson, PageHeader, Spinner } from "@/components/admin/adminui";
import { fmtDateTime, fmtNumber } from "@/lib/utils";

interface Stats {
  published: number;
  drafts: number;
  scheduled: number;
  postViews: number;
  siteViews: number;
  mediaCount: number;
  categoriesCount: number;
  unreadMessages: number;
  daily: { day: string; count: number }[];
  topPosts: { title: string; slug: string; views: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchJson<Stats>("/api/admin/stats")
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return <Spinner />;

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.count));

  const cards = [
    { label: "مقالات منشورة", value: stats.published, href: "/admin/posts?status=published", color: "from-emerald-500 to-teal-500" },
    { label: "مسودات", value: stats.drafts, href: "/admin/posts?status=draft", color: "from-amber-500 to-orange-500" },
    { label: "مجدولة", value: stats.scheduled, href: "/admin/posts?status=scheduled", color: "from-sky-500 to-indigo-500" },
    { label: "إجمالي مشاهدات المقالات", value: stats.postViews, href: "#", color: "from-violet-500 to-fuchsia-500" },
    { label: "رسائل غير مقروءة", value: stats.unreadMessages, href: "/admin/messages", color: "from-rose-500 to-red-500" },
    { label: "صور في المكتبة", value: stats.mediaCount, href: "/admin/media", color: "from-cyan-500 to-blue-500" },
  ];

  return (
    <>
      <PageHeader
        title="نظرة عامة"
        desc={`إجمالي مشاهدات الموقع المسجلة: ${fmtNumber(stats.siteViews)} — أرقام حقيقية من سجل المشاهدات`}
        action={
          <Link href="/admin/posts/new" className="btn-primary">
            + مقال جديد
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card p-5 transition-all hover:-translate-y-0.5 hover:shadow-soft">
            <div className={`mb-3 h-1.5 w-10 rounded-full bg-gradient-to-l ${c.color}`} />
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{fmtNumber(c.value)}</p>
            <p className="mt-1 text-xs font-semibold text-zinc-500">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* مشاهدات آخر 14 يومًا */}
        <div className="card p-6">
          <h2 className="mb-6 font-bold text-zinc-900 dark:text-white">مشاهدات المقالات — آخر 14 يومًا</h2>
          {stats.daily.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">لا توجد مشاهدات مسجلة بعد. ستظهر الإحصائيات تلقائيًا مع زيارات الزوار.</p>
          ) : (
            <div className="flex h-44 items-end justify-between gap-1.5" dir="ltr">
              {stats.daily.map((d) => (
                <div key={d.day} className="group relative flex flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full max-w-8 rounded-t-lg transition-all group-hover:opacity-80"
                    style={{
                      height: `${Math.max(6, (d.count / maxDaily) * 130)}px`,
                      backgroundImage: "linear-gradient(180deg, var(--brand-2), var(--brand))",
                    }}
                  />
                  <span className="mt-2 text-[9px] text-zinc-400">{d.day.slice(5)}</span>
                  <span className="pointer-events-none absolute -top-7 rounded-lg bg-zinc-900 px-2 py-1 text-[10px] font-bold text-white dark:bg-zinc-700">
                    {fmtNumber(d.count)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* الأكثر مشاهدة */}
        <div className="card p-6">
          <h2 className="mb-4 font-bold text-zinc-900 dark:text-white">المقالات الأكثر مشاهدة</h2>
          {stats.topPosts.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">لا توجد مشاهدات بعد.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {stats.topPosts.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-3 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-black text-zinc-500 dark:bg-zinc-800">
                    {i + 1}
                  </span>
                  <Link
                    href={`/post/${encodeURIComponent(p.slug)}`}
                    target="_blank"
                    className="flex-1 truncate text-sm font-semibold text-zinc-700 hover:text-[var(--brand)] dark:text-zinc-300"
                  >
                    {p.title}
                  </Link>
                  <span className="chip">{fmtNumber(p.views)} 👁</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
