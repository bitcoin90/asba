"use client";

import { useEffect } from "react";

/** تسجيل مشاهدة حقيقية للصفحة (مرة واحدة لكل جلسة لكل مقال) */
export default function ViewTracker({ path, slug }: { path: string; slug?: string }) {
  useEffect(() => {
    let key = "asba-view";
    try {
      key = `asba-view:${slug || path}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    fetch("/api/stats/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, slug }),
      keepalive: true,
    }).catch(() => {});
  }, [path, slug]);
  return null;
}
