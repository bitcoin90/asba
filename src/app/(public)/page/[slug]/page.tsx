import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import ContactForm from "@/components/public/ContactForm";
import Reveal from "@/components/public/Reveal";
import { getPage } from "@/lib/queries";
import { METADATA_BASE } from "@/lib/site";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = safeDecode((await params).slug);
  const page = await getPage(slug);
  if (!page) return { title: "الصفحة غير موجودة" };
  const base = process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    : "";
  return {
    title: page.title,
    description: page.content.replace(/<[^>]+>/g, " ").slice(0, 160),
    alternates: base ? { canonical: `${base}/page/${page.slug}` } : undefined,
  };
}

export default async function StaticPage({ params }: Props) {
  const slug = safeDecode((await params).slug);
  const page = await getPage(slug);
  if (!page) notFound();

  // GEO — WebPage منظمة لكل صفحة
  const base = await METADATA_BASE();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    url: `${base}/page/${encodeURIComponent(page.slug)}`,
    description: page.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160),
    dateModified: page.updated_at,
    inLanguage: "ar",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Reveal>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white sm:text-4xl">{page.title}</h1>
        <p className="mt-3 text-xs text-zinc-500">
          آخر تحديث:{" "}
          <time dateTime={page.updated_at}>{fmtDate(page.updated_at)}</time>
        </p>
      </Reveal>
      <Reveal className="mt-8">
        <div className="card p-6 sm:p-10">
          <div className="prose-ar" dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </Reveal>
      {slug === "contact" && (
        <Reveal className="mt-8">
          <ContactForm />
        </Reveal>
      )}
    </div>
  );
}
