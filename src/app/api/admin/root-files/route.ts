import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  listRootFiles,
  upsertRootFile,
  deleteRootFile,
  isValidRootFileName,
  mimeForName,
} from "@/lib/rootFiles";

const MAX_CONTENT = 100_000; // 100 كيلوبايت تكفي أي ملف تحقق

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const files = await listRootFiles();
  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const content = String(body.content ?? "");
    if (!isValidRootFileName(name)) {
      return NextResponse.json(
        { error: "اسم الملف غير صالح — استخدم أحرفًا لاتينية وأرقامًا مثل google1a2b3c.html أو ads.txt" },
        { status: 400 }
      );
    }
    if (!content.trim()) {
      return NextResponse.json({ error: "محتوى الملف مطلوب" }, { status: 400 });
    }
    if (content.length > MAX_CONTENT) {
      return NextResponse.json({ error: "الملف أكبر من الحد المسموح (100KB)" }, { status: 400 });
    }
    await upsertRootFile(name, content, mimeForName(name));
    return NextResponse.json({ ok: true, url: `/${name}` });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const name = req.nextUrl.searchParams.get("name") || "";
  if (!isValidRootFileName(name)) {
    return NextResponse.json({ error: "اسم الملف غير صالح" }, { status: 400 });
  }
  await deleteRootFile(name);
  return NextResponse.json({ ok: true });
}
