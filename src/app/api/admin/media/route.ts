import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query, one, insert, nowISO } from "@/lib/db";
import type { MediaRow } from "@/lib/types";

const MAX_SIZE = 6 * 1024 * 1024; // 6MB بعد التصغير في المتصفح

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const perPage = 24;
  const rows = await query<MediaRow>(
    `SELECT id, filename, mime, size, width, height, created_at FROM media
     ORDER BY id DESC LIMIT ? OFFSET ?`,
    [perPage, (page - 1) * perPage]
  );
  const totalRow = await one<{ c: number }>("SELECT COUNT(*) AS c FROM media");
  return NextResponse.json({ media: rows, total: Number(totalRow?.c ?? 0), page, perPage });
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "لم يتم إرسال ملف" }, { status: 400 });
    }
    if (!file.type.startsWith("image/") && file.type !== "image/svg+xml") {
      return NextResponse.json({ error: "الملف يجب أن يكون صورة" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_SIZE) {
      return NextResponse.json({ error: "حجم الصورة كبير جدًا (الحد 6 ميجابايت)" }, { status: 400 });
    }

    const width = parseInt(String(form.get("width") || "0"), 10) || 0;
    const height = parseInt(String(form.get("height") || "0"), 10) || 0;
    const filename = (file.name || `image-${Date.now()}`).slice(0, 200).replace(/[^\w.\-\u0600-\u06FF]/g, "_");

    const id = await insert("media", {
      filename,
      mime: file.type,
      size: buf.length,
      width,
      height,
      data: buf,
      created_at: nowISO(),
    });
    return NextResponse.json({ ok: true, id, url: `/api/media/${id}`, filename, width, height, size: buf.length });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
