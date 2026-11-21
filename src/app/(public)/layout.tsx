import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import AdSlot from "@/components/public/AdSlot";
import { getSettings } from "@/lib/settings";
import { listCategories, listPages, getAdsMap } from "@/lib/queries";
import { ACCENTS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const categories = await listCategories();
  const pages = await listPages();
  const ads = await getAdsMap();

  const accent = ACCENTS[settings.theme_accent] || ACCENTS["#6366f1"];

  const navItems: { href: string; label: string }[] = [{ href: "/", label: "الرئيسية" }];
  const has = (slug: string) => pages.some((p) => p.slug === slug);
  if (has("works")) navItems.push({ href: "/page/works", label: "أعمالي" });
  if (has("about")) navItems.push({ href: "/page/about", label: "من نحن" });
  if (has("contact")) navItems.push({ href: "/page/contact", label: "اتصل بنا" });

  const footerPages = pages
    .filter((p) => ["about", "contact", "privacy", "terms", "disclaimer", "works"].includes(p.slug))
    .map((p) => ({ slug: p.slug, title: p.title }));

  const logoUrl = settings.logo_media_id ? `/api/media/${settings.logo_media_id}` : undefined;

  return (
    <div style={{ "--brand": accent.a, "--brand-2": accent.b } as React.CSSProperties}>
      <Header siteName={settings.site_name} logoUrl={logoUrl} navItems={navItems} />
      <main className="min-h-[50vh]">{children}</main>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AdSlot placement="footer" code={ads.footer?.enabled ? ads.footer.code : ""} enabled={!!ads.footer?.enabled} minHeight={90} />
      </div>
      <Footer settings={settings} categories={categories} pages={footerPages} />
    </div>
  );
}
