"use client";

import { useState } from "react";

export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function share(kind: string) {
    const url = encodeURIComponent(window.location.href);
    const t = encodeURIComponent(title);
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${t}%20${url}`,
      x: `https://twitter.com/intent/tweet?text=${t}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${t}`,
    };
    if (kind === "copy") {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
      return;
    }
    if (links[kind]) window.open(links[kind], "_blank", "noopener,width=600,height=500");
  }

  const btn =
    "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] dark:border-zinc-800 dark:text-zinc-400";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="ml-1 text-sm font-bold text-zinc-700 dark:text-zinc-300">شارك المقال:</span>
      <button onClick={() => share("whatsapp")} className={btn} aria-label="مشاركة على واتساب" title="واتساب">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.29-.15-1.71-.84-1.98-.94-.26-.09-.45-.14-.64.15-.19.29-.74.94-.9 1.13-.17.19-.33.21-.62.07-.29-.15-1.21-.45-2.31-1.42-.85-.76-1.43-1.7-1.6-1.99-.16-.29-.02-.44.13-.59.13-.13.29-.33.44-.5.14-.16.19-.28.29-.47.09-.19.05-.35-.05-.5-.1-.14-.64-1.56-.88-2.13-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.35-.26.29-1 .97-1 2.37s1.02 2.75 1.17 2.94c.14.19 2.01 3.06 4.87 4.29.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.11.55-.08 1.71-.7 1.95-1.37.24-.68.24-1.25.17-1.37-.07-.12-.26-.19-.55-.34zM12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 1 1 8.38 4.63zm8.42-18.26A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.15 1.6 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.47-8.38z"/></svg>
      </button>
      <button onClick={() => share("x")} className={btn} aria-label="مشاركة على X" title="X (تويتر)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 1.2h3.7l-8.1 9.3L24 22.8h-7.5l-5.9-7.7-6.7 7.7H.2l8.7-9.9L0 1.2h7.7l5.3 7 6-7zm-1.3 19.4h2L6.6 3.3h-2.2l13.2 17.3z"/></svg>
      </button>
      <button onClick={() => share("facebook")} className={btn} aria-label="مشاركة على فيسبوك" title="فيسبوك">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.8V24C19.62 23.09 24 18.1 24 12.07z"/></svg>
      </button>
      <button onClick={() => share("telegram")} className={btn} aria-label="مشاركة على تيليجرام" title="تيليجرام">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.94 0A12 12 0 1 0 24 12 12 12 0 0 0 11.94 0zm5.87 8.16-1.97 9.3c-.15.66-.54.82-1.09.51l-3-2.21-1.45 1.4a.75.75 0 0 1-.66.2l.51-3.05 5.56-5.02c.24-.21-.05-.33-.37-.12l-6.87 4.33-2.96-.93c-.64-.2-.65-.64.14-.95l11.57-4.46c.53-.24 1.05.13.87.9z"/></svg>
      </button>
      <button onClick={() => share("copy")} className={btn} aria-label="نسخ الرابط" title="نسخ الرابط">
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        )}
      </button>
      {copied && <span className="text-xs font-semibold text-emerald-600">تم النسخ!</span>}
    </div>
  );
}
