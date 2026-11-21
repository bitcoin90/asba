"use client";

import { useEffect, useRef } from "react";

/** مساحة إعلانية — تُحقن الأكواد مع تنفيذ السكربتات (متوافقة مع Google AdSense) */
export default function AdSlot({
  placement,
  code,
  enabled,
  className = "",
  minHeight = 0,
}: {
  placement: string;
  code: string;
  enabled: boolean;
  className?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !code || !ref.current) return;
    const el = ref.current;
    el.innerHTML = code;
    // إعادة إنشاء السكربتات لضمان تنفيذها
    el.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      s.textContent = old.textContent || "";
      old.replaceWith(s);
    });
    return () => {
      el.innerHTML = "";
    };
  }, [enabled, code]);

  if (!enabled || !code) return null;
  return (
    <div
      ref={ref}
      data-placement={placement}
      className={`ad-slot ${className}`}
      style={minHeight ? { minHeight } : undefined}
      aria-hidden="true"
    />
  );
}
