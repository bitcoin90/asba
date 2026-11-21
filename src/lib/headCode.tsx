// تحويل كود <head> المخصص (من لوحة التحكم) إلى عناصر React حقيقية
// يدعم وسوم التحقق الشائعة: meta / link / script / style
import type { ReactNode } from "react";

const TAG_RE = /<(meta|link|script|style)\b([^>]*?)(\/>|>([\s\S]*?)<\/\s*\1\s*>)/gi;

function parseAttrs(raw: string): Record<string, string | true> {
  const attrs: Record<string, string | true> = {};
  const re = /([a-zA-Z_:@][-\w:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? "";
  // سمات منطقية بدون قيمة مثل async و defer و nomodule
  for (const flag of ["async", "defer", "nomodule"]) {
    if (new RegExp(`\\b${flag}\\b(?!\\s*=)`).test(raw)) attrs[flag] = true;
  }
  if (/\bcrossorigin\b(?!\s*=)/.test(raw)) attrs.crossorigin = "";
  return attrs;
}

const PROP_MAP: Record<string, string> = { charset: "charSet", class: "className", for: "htmlFor" };

function toProps(attrs: Record<string, string | true>): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(attrs)) props[PROP_MAP[k] || k] = v;
  return props;
}

export function renderHeadCode(html: string): ReactNode[] {
  if (!html || !html.trim()) return [];
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, "");
  const nodes: ReactNode[] = [];
  let m: RegExpExecArray | null;
  let i = 0;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(cleaned))) {
    const tag = m[1].toLowerCase();
    const attrs = toProps(parseAttrs(m[2] || ""));
    const inner = m[4] ?? "";
    if (tag === "meta") nodes.push(<meta key={i++} {...attrs} />);
    else if (tag === "link") nodes.push(<link key={i++} {...attrs} />);
    else if (tag === "style") nodes.push(<style key={i++} dangerouslySetInnerHTML={{ __html: inner }} />);
    else if (tag === "script") {
      if (attrs.src) nodes.push(<script key={i++} {...attrs} />);
      else nodes.push(<script key={i++} {...attrs} dangerouslySetInnerHTML={{ __html: inner }} />);
    }
  }
  return nodes;
}
