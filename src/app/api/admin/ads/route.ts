import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query, one, nowISO } from "@/lib/db";
import { AD_PLACEMENTS } from "@/lib/types";
import type { AdRow } from "@/lib/types";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  const rows = await query<AdRow>("SELECT * FROM ads ORDER BY id ASC");
  return NextResponse.json({ ads: rows });
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  try {
    const body = await req.json();
    const items = Array.isArray(body.ads) ? body.ads : [];
    for (const item of items) {
      const placement = String(item.placement || "");
      if (!AD_PLACEMENTS[placement]) continue;
      const code = String(item.code || "").slice(0, 20000);
      const enabled = item.enabled ? 1 : 0;
      const existing = await one<{ id: number }>("SELECT id FROM ads WHERE placement = ?", [placement]);
      if (existing) {
        await query("UPDATE ads SET code = ?, enabled = ?, updated_at = ? WHERE placement = ?", [
          code,
          enabled,
          nowISO(),
          placement,
        ]);
      } else {
        await query("INSERT INTO ads (placement, code, enabled, updated_at) VALUES (?, ?, ?, ?)", [
          placement,
          code,
          enabled,
          nowISO(),
        ]);
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
