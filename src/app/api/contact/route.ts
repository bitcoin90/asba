import { NextRequest, NextResponse } from "next/server";
import { insert, nowISO } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // فخ السبام: الحقل المخفي يجب أن يبقى فارغًا
    if (typeof body.website === "string" && body.website.trim()) {
      return NextResponse.json({ ok: true, message: "تم إرسال رسالتك بنجاح، شكرًا لتواصلك!" });
    }
    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().slice(0, 200);
    const subject = String(body.subject || "").trim().slice(0, 150);
    const message = String(body.message || "").trim().slice(0, 5000);

    if (name.length < 2) return NextResponse.json({ error: "الاسم قصير جدًا" }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 });
    if (message.length < 5)
      return NextResponse.json({ error: "الرسالة قصيرة جدًا" }, { status: 400 });

    await insert("messages", { name, email, subject, body: message, is_read: 0, created_at: nowISO() });
    return NextResponse.json({ ok: true, message: "تم إرسال رسالتك بنجاح، شكرًا لتواصلك!" });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
