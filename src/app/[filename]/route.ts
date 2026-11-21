import { NextRequest, NextResponse } from "next/server";
import { getRootFile } from "@/lib/rootFiles";

export const dynamic = "force-dynamic";

// خدمة ملفات إثبات الملكية من جذر الموقع: /google123.html أو /ads.txt
export async function GET(_req: NextRequest, ctx: { params: Promise<{ filename: string }> }) {
  const { filename } = await ctx.params;
  const name = String(filename || "").trim();
  if (!name) return new NextResponse("Not Found", { status: 404 });
  try {
    const row = await getRootFile(name);
    if (!row) return new NextResponse("Not Found", { status: 404 });
    return new NextResponse(row.content, {
      headers: {
        "content-type": row.mime || "text/plain; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
