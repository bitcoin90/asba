import { NextRequest, NextResponse } from "next/server";
import { recordView } from "@/lib/queries";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path.slice(0, 200) : "";
    const slug = typeof body.slug === "string" ? body.slug.slice(0, 200) : undefined;
    if (!path) return NextResponse.json({ error: "path مطلوب" }, { status: 400 });
    await recordView(path, slug);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
