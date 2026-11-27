// تقصير الروابط — روابط مختصرة على دومين الموقع (/s/الكود) مع عداد نقرات
import { one, q as query, nowISO } from "./db";

export interface ShortLinkRow {
  id: number;
  code: string;
  url: string;
  title: string;
  clicks: number;
  created_at: string;
  updated_at: string;
}

const COLS = "id, code, url, title, clicks, created_at, updated_at";

// كود الرابط المختصر: أحرف لاتينية وأرقام وشرطات، من 3 إلى 30 حرفًا
const CODE_RE = /^[A-Za-z0-9_-]{3,30}$/;

export function isValidCode(code: string): boolean {
  return CODE_RE.test(code);
}

// الرابط المستهدف يجب أن يكون http أو https صالحًا
export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// أبجدية توليد الأكواد — بدون أحرف ملتبسة بصريًا (l, i, 1, o, 0)
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateCode(len = 6): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export async function listShortLinks(): Promise<ShortLinkRow[]> {
  return query<ShortLinkRow>(`SELECT ${COLS} FROM short_links ORDER BY id DESC`);
}

export async function getShortLinkByCode(code: string): Promise<ShortLinkRow | null> {
  return one<ShortLinkRow>(`SELECT ${COLS} FROM short_links WHERE code = ?`, [code]);
}

export async function codeExists(code: string): Promise<boolean> {
  return !!(await one<{ id: number }>("SELECT id FROM short_links WHERE code = ?", [code]));
}

export async function createShortLink(code: string, url: string, title: string): Promise<void> {
  const now = nowISO();
  await query(
    "INSERT INTO short_links (code, url, title, clicks, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)",
    [code, url, title, now, now]
  );
}

export async function updateShortLink(id: number, code: string, url: string, title: string): Promise<void> {
  await query("UPDATE short_links SET code = ?, url = ?, title = ?, updated_at = ? WHERE id = ?", [
    code,
    url,
    title,
    nowISO(),
    id,
  ]);
}

export async function deleteShortLink(id: number): Promise<void> {
  await query("DELETE FROM short_links WHERE id = ?", [id]);
}

export async function incrementClicks(id: number): Promise<void> {
  await query("UPDATE short_links SET clicks = clicks + 1 WHERE id = ?", [id]);
}
