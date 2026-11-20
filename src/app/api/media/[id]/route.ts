import { NextResponse } from "next/server";
import { one } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const numId = parseInt(id, 10);
    if (!Number.isFinite(numId)) return new Response("Not found", { status: 404 });

    const row = await one<{ data: Buffer; mime: string; filename: string }>(
      "SELECT data, mime, filename FROM media WHERE id = ?",
      [numId]
    );
    if (!row) return new Response("Not found", { status: 404 });

    const buf = row.data;
    return new Response(new Uint8Array(buf), {
      headers: {
        "content-type": row.mime || "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
        "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(row.filename)}`,
      },
    });
  } catch {
    return new Response("Error", { status: 500 });
  }
}
