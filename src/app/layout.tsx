import type { Metadata } from "next";
import "./globals.css";
import { getSetting } from "@/lib/settings";
import { renderHeadCode } from "@/lib/headCode";

export const metadata: Metadata = {
  title: {
    default: "ASBA AI",
    template: "%s | ASBA AI",
  },
  description:
    "مدونة ASBA AI — مقالات وشروحات ومشاريع في الذكاء الاصطناعي والتقنية والإبداع الرقمي.",
  icons: { icon: "/icon.svg" },
};

const themeInit = `(function(){try{var t=localStorage.getItem('asba-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // كود <head> المخصص — أكواد التحقق من ملكية النطاق وشبكات الإعلانات (من لوحة التحكم)
  let headCode = "";
  try {
    headCode = (await getSetting("head_code")) || "";
  } catch {}

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {renderHeadCode(headCode)}
      </head>
      <body>{children}</body>
    </html>
  );
}
