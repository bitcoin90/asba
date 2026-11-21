// إعدادات الموقع — قراءة وكتابة مع تخزين مؤقت بسيط لكل طلب
import { one, q as query, insert } from "./db";

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  site_description: string;
  author_name: string;
  about_short: string;
  contact_email: string;
  footer_text: string;
  theme_accent: string;
  logo_media_id: string;
  social_x: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  social_telegram: string;
  social_github: string;
  social_linkedin: string;
  [key: string]: string;
}

export const SETTINGS_KEYS = [
  "site_name",
  "site_tagline",
  "site_description",
  "author_name",
  "about_short",
  "contact_email",
  "footer_text",
  "theme_accent",
  "logo_media_id",
  "social_x",
  "social_facebook",
  "social_instagram",
  "social_youtube",
  "social_telegram",
  "social_github",
  "social_linkedin",
];

export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: "ASBA AI",
  site_tagline: "مدونة الذكاء الاصطناعي والتقنية والإبداع الرقمي",
  site_description:
    "مدونة ASBA AI — مقالات وشروحات ومشاريع في الذكاء الاصطناعي والتقنية والإبداع الرقمي، بلغة عربية واضحة وبأسلوب عملي.",
  author_name: "ASBA AI",
  about_short:
    "ASBA AI مساحة شخصية لنشر المقالات والشروحات والمشاريع في الذكاء الاصطناعي والتقنية، بهدف تقريب هذه التقنيات من القارئ العربي بأسلوب عملي وواضح.",
  contact_email: "",
  footer_text: "© ASBA AI — جميع الحقوق محفوظة",
  theme_accent: "#6366f1",
  logo_media_id: "",
  social_x: "",
  social_facebook: "",
  social_instagram: "",
  social_youtube: "",
  social_telegram: "",
  social_github: "",
  social_linkedin: "",
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const rows = await query<{ key: string; value: string }>(
      "SELECT key, value FROM settings"
    );
    const s: SiteSettings = { ...DEFAULT_SETTINGS };
    for (const r of rows) {
      if (r.value !== null && r.value !== undefined && r.value !== "") {
        (s as any)[r.key] = r.value;
      }
    }
    return s;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await one<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
  return row ? row.value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await getSetting(key);
  if (existing === null) {
    await insert("settings", { key, value });
  } else {
    await query("UPDATE settings SET value = ? WHERE key = ?", [value, key]);
  }
}

export async function saveSettings(data: Record<string, string>): Promise<void> {
  for (const [k, v] of Object.entries(data)) {
    if (!SETTINGS_KEYS.includes(k)) continue;
    await setSetting(k, String(v ?? ""));
  }
}
