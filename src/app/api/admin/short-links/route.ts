import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ensureData } from "@/lib/db";
import {
  listShortLinks,
  createShortLink,
  updateShortLink,
  deleteShortLink,
  codeExists,
  isValidCode,
  isValidUrl,
  generateCode,
} from "@/lib/shortLinks";

interface Body {
  id?: number;
  code?: string;
  url?: string;
  title?: string;
}

// يتحقق من الحقول المشتركة بين الإنشاء والتعديل ويعيد رسالة خطأ أو null
async function validate(body: Body): Promise<{ code: string; url: string; title: string; error?: string }> {
  const url = String(body.url || "").trim();
  const code = String(body.code || "").trim();
  const title = String(body.title || "").trim().slice(0, 200);

  if (!url) return { code, url, title, error: "الرابط الأصلي مطلوب" };
  if (!isValidUrl(url)) return { code, url, title, error: "الرابط الأصلي غير صالح — يجب أن يبدأ بـ http:// أو https://" };

  if (!code) {
    // توليد كود فريد تلقائيًا
    let generated = "";
    for (let i = 0; i < 10; i++) {
      generated = generateCode();
      if (!(await codeExists(generated))) break;
      generated = "";
    }
    if (!generated) return { code, url, title, error: "تعذر توليد كود فريد — حاول مرة أخرى" };
    return { code: generated, url, title };
  }

  if (!isValidCode(code))
    return { code, url, title, error: "الكود غير صالح — استخدم 3-30 حرفًا لاتينيًا أو رقمًا أو شرطة بدون مسافات" };
  if (await codeExists(code)) return { code, url, title, error: `الكود «${code}» مستخدم بالفعل — اختر كودًا آخر` };

  return { code, url, title };
}

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  await ensureData();
  const links = await listShortLinks();
  const totalClicks = links.reduce((s, l) => s + (l.clicks || 0), 0);
  return NextResponse.json({ links, totalClicks });
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  await ensureData();
  try {
    const body = (await req.json()) as Body;
    const v = await validate(body);
    if (v.error) return NextResponse.json({ error: v.error }, { status: 400 });
    await createShortLink(v.code, v.url, v.title);
    return NextResponse.json({ ok: true, code: v.code });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  await ensureData();
  try {
    const body = (await req.json()) as Body;
    const id = Number(body.id || 0);
    if (!id) return NextResponse.json({ error: "معرف الرابط مطلوب" }, { status: 400 });
    const v = await validate(body);
    if (v.error) return NextResponse.json({ error: v.error }, { status: 400 });
    await updateShortLink(id, v.code, v.url, v.title);
    return NextResponse.json({ ok: true, code: v.code });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  await ensureData();
  const id = Number(req.nextUrl.searchParams.get("id") || 0);
  if (!id) return NextResponse.json({ error: "معرف الرابط مطلوب" }, { status: 400 });
  await deleteShortLink(id);
  return NextResponse.json({ ok: true });
}
