// ملفات إثبات الملكية في جذر الموقع (مثل google123.html و ads.txt)
import { one, q as query, nowISO } from "./db";

export interface RootFileRow {
  id: number;
  name: string;
  content: string;
  mime: string;
  updated_at: string;
}

// اسم آمن: أحرف لاتينية/أرقام/نقطة/شرطة، بدون مسارات ولا نقاط متتالية
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export function isValidRootFileName(name: string): boolean {
  return NAME_RE.test(name) && !name.includes("..");
}

const MIME_BY_EXT: Record<string, string> = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  txt: "text/plain; charset=utf-8",
  json: "application/json; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  svg: "image/svg+xml",
  webmanifest: "application/manifest+json",
  md: "text/plain; charset=utf-8",
};

export function mimeForName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return MIME_BY_EXT[ext] || "text/plain; charset=utf-8";
}

export async function listRootFiles(): Promise<RootFileRow[]> {
  return query<RootFileRow>("SELECT id, name, content, mime, updated_at FROM root_files ORDER BY name ASC");
}

export async function getRootFile(name: string): Promise<RootFileRow | null> {
  return one<RootFileRow>("SELECT id, name, content, mime, updated_at FROM root_files WHERE name = ?", [name]);
}

export async function upsertRootFile(name: string, content: string, mime: string): Promise<void> {
  const existing = await one<{ id: number }>("SELECT id FROM root_files WHERE name = ?", [name]);
  if (existing) {
    await query("UPDATE root_files SET content = ?, mime = ?, updated_at = ? WHERE name = ?", [
      content,
      mime,
      nowISO(),
      name,
    ]);
  } else {
    await query("INSERT INTO root_files (name, content, mime, updated_at) VALUES (?, ?, ?, ?)", [
      name,
      content,
      mime,
      nowISO(),
    ]);
  }
}

export async function deleteRootFile(name: string): Promise<void> {
  await query("DELETE FROM root_files WHERE name = ?", [name]);
}
