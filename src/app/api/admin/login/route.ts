import { NextRequest, NextResponse } from "next/server";
import {
  checkCredentials,
  setSessionCookie,
  rateLimit,
  clearRateLimit,
  clientIp,
  getAdminUsername,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    if (!rateLimit(`login:${ip}`)) {
      return NextResponse.json(
        { error: "عدد كبير من المحاولات، انتظر 15 دقيقة ثم أعد المحاولة." },
        { status: 429 }
      );
    }
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json({ error: "أدخل اسم المستخدم وكلمة المرور" }, { status: 400 });
    }

    const hasEnvPassword = !!(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 4);
    const dbHash = await import("@/lib/settings").then((m) => m.getSetting("admin_password_hash"));
    if (!hasEnvPassword && !dbHash) {
      return NextResponse.json(
        {
          error:
            "لم يتم تعيين كلمة مرور للوحة التحكم. عيّن المتغير ADMIN_PASSWORD في إعدادات البيئة (Vercel ← Settings ← Environment Variables) ثم أعد النشر.",
        },
        { status: 503 }
      );
    }

    const ok = await checkCredentials(username, password);
    if (!ok) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    clearRateLimit(`login:${ip}`);
    const adminUser = await getAdminUsername();
    const https =
      (req.headers.get("x-forwarded-proto") || "").includes("https") ||
      req.nextUrl.protocol === "https:";
    await setSessionCookie(adminUser, https);
    return NextResponse.json({ ok: true, username: adminUser });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
