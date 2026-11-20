import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  checkCredentials,
  hashPassword,
  setSessionCookie,
  getAdminUsername,
} from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const current = String(body.current_password || "");
    const next = String(body.new_password || "");

    if (next.length < 8) {
      return NextResponse.json({ error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
    }

    const adminUser = await getAdminUsername();
    const ok = await checkCredentials(adminUser, current);
    if (!ok) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    }

    await setSetting("admin_password_hash", hashPassword(next));
    // جلسة جديدة بعد تغيير كلمة المرور
    const https =
      (req.headers.get("x-forwarded-proto") || "").includes("https") ||
      req.nextUrl.protocol === "https:";
    await setSessionCookie(session.u, https);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
