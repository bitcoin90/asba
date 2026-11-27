import { NextRequest, NextResponse } from "next/server";
import { ensureData } from "@/lib/db";
import { getShortLinkByCode, incrementClicks, isValidCode } from "@/lib/shortLinks";

export const dynamic = "force-dynamic";

function notFoundPage(code: string): Response {
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>الرابط المختصر غير موجود</title><style>body{font-family:system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#fafafa;color:#18181b}.box{text-align:center;padding:3rem 1.5rem;max-width:28rem}h1{font-size:1.5rem;margin:0 0 1rem}p{color:#71717a;line-height:1.8;margin:0 0 1.5rem}a{color:#4f46e5;text-decoration:none;font-weight:700}</style></head><body><div class="box"><h1>الرابط المختصر غير موجود</h1><p>الرمز «${code}» غير مسجل في النظام — تأكد من صحة الرابط أو تواصل مع صاحب الموقع.</p><a href="/">العودة للصفحة الرئيسية ←</a></div></body></html>`;
  return new Response(html, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  await ensureData();
  const { code: raw } = await params;
  let code = raw;
  try {
    code = decodeURIComponent(raw);
  } catch {
    // اتركه كما هو إن فشل فك الترميز
  }
  if (!isValidCode(code)) return notFoundPage(code);

  const link = await getShortLinkByCode(code);
  if (!link) return notFoundPage(code);

  // عدّاد النقرات — لا يعطل التحويل إن فشل
  try {
    await incrementClicks(link.id);
  } catch {}

  return NextResponse.redirect(link.url, { status: 302 });
}
