import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query, one } from "@/lib/db";
import type { MessageRow } from "@/lib/types";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const unreadOnly = sp.get("unread") === "1";
  if (sp.get("count") === "1") {
    const row = await one<{ c: number }>("SELECT COUNT(*) AS c FROM messages WHERE is_read = 0");
    return NextResponse.json({ unread: Number(row?.c ?? 0) });
  }
  const rows = await query<MessageRow>(
    `SELECT * FROM messages ${unreadOnly ? "WHERE is_read = 0" : ""} ORDER BY created_at DESC LIMIT 100`
  );
  return NextResponse.json({ messages: rows });
}
