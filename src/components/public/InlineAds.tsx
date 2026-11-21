"use client";

import { useEffect } from "react";

/** يبحث عن علامات مواضع الإعلان داخل المحتوى المُصيَّر من الخادم ويحقن الكود مع تنفيذ السكربتات */
export default function InlineAds({ placement, code }: { placement: string; code: string }) {
  useEffect(() => {
    if (!code) return;
    const markers = document.querySelectorAll(`[data-asba-ad="${placement}"]`);
    markers.forEach((el) => {
      const host = el as HTMLElement;
      host.innerHTML = code;
      host.querySelectorAll("script").forEach((old) => {
        const s = document.createElement("script");
        Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
        s.textContent = old.textContent || "";
        old.replaceWith(s);
      });
    });
  }, [placement, code]);
  return null;
}
