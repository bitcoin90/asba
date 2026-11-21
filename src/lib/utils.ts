// أدوات مساعدة عامة
export function slugify(text: string): string {
  const s = (text || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\u0640]/g, "") // إزالة التطويل
    .replace(/[\u064B-\u0652]/g, "") // إزالة التشكيل
    .replace(/[^\u0621-\u064Aa-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s;
}

export function uniqueSlug(base: string, exists: (s: string) => Promise<boolean>): Promise<string> {
  return (async () => {
    const root = slugify(base) || `post-${Date.now().toString(36)}`;
    let slug = root;
    let i = 2;
    while (await exists(slug)) {
      slug = `${root}-${i++}`;
      if (i > 100) return `${root}-${Date.now().toString(36)}`;
    }
    return slug;
  })();
}

export function stripHtml(html: string): string {
  return (html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function autoExcerpt(html: string, limit = 180): string {
  const text = stripHtml(html);
  if (text.length <= limit) return text;
  return text.slice(0, limit).trimEnd() + "…";
}

export function readingMinutes(html: string): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((t) => typeof t === "string" && t.trim()) : [];
  } catch {
    return [];
  }
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-u-nu-latn", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 10);
  }
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-u-nu-latn", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return String(iso).slice(0, 16).replace("T", " ");
  }
}

export function fmtNumber(n: number | null | undefined): string {
  try {
    return new Intl.NumberFormat("ar-u-nu-latn").format(Number(n || 0));
  } catch {
    return String(n || 0);
  }
}

export function xmlEscape(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** حقن كود الإعلان في منتصف فقرات محتوى المقال */
export function injectMiddleAd(content: string, adHtml: string): string {
  if (!adHtml || !content) return content;
  const parts = content.split(/(<\/p>)/i);
  // اجمع الأزواج: نص + وسم الإغلاق
  const blocks: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    blocks.push(parts[i] + (parts[i + 1] || ""));
  }
  const realBlocks = blocks.filter((b) => stripHtml(b).length > 40);
  if (realBlocks.length < 3) return content;
  const mid = Math.floor(realBlocks.length / 2);
  const target = realBlocks[mid];
  return content.replace(target, target + adHtml);
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const ACCENTS: Record<string, { label: string; a: string; b: string }> = {
  "#6366f1": { label: "بنفسجي", a: "#6366f1", b: "#a855f7" },
  "#0ea5e9": { label: "أزرق سماوي", a: "#0ea5e9", b: "#6366f1" },
  "#10b981": { label: "أخضر زمردي", a: "#10b981", b: "#14b8a6" },
  "#f43f5e": { label: "وردي", a: "#f43f5e", b: "#f97316" },
  "#f59e0b": { label: "كهرماني", a: "#f59e0b", b: "#f43f5e" },
};
