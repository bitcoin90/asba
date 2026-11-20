import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await ctx.params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const isRead = body.is_read ? 1 : 0;
  await query("UPDATE messages SET is_read = ? WHERE id = ?", [isRead, numId]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const { id } = await ctx.params;
  const numId = parseInt(id, 10);
  if (!Number.isFinite(numId)) return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });
  await query("DELETE FROM messages WHERE id = ?", [numId]);
  return NextResponse.json({ ok: true });
}
