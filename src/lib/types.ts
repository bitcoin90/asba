export type Row = Record<string, any>;

export type PostStatus = "draft" | "published" | "scheduled";

export interface PostRow {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_media_id: number | null;
  cover_url: string | null;
  category_id: number | null;
  tags: string;
  status: PostStatus;
  published_at: string | null;
  featured: number;
  seo_title: string;
  seo_description: string;
  og_media_id: number | null;
  views: number;
  created_at: string;
  updated_at: string;
  category_name?: string | null;
  category_slug?: string | null;
}

export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  count?: number;
}

export interface PageRow {
  id: number;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
}

export interface MediaRow {
  id: number;
  filename: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  created_at: string;
}

export interface AdRow {
  id: number;
  placement: string;
  code: string;
  enabled: number;
  updated_at: string;
}

export interface MessageRow {
  id: number;
  name: string;
  email: string;
  subject: string;
  body: string;
  is_read: number;
  created_at: string;
}

export const AD_PLACEMENTS: Record<string, { title: string; desc: string }> = {
  home_top: { title: "أعلى الصفحة الرئيسية", desc: "يظهر أسفل قسم الترحيب مباشرة" },
  home_bottom: { title: "أسفل الصفحة الرئيسية", desc: "يظهر قبل التذييل" },
  article_top: { title: "أعلى المقال", desc: "يظهر بين عنوان المقال ومحتواه" },
  article_middle: { title: "وسط المقال", desc: "يظهر بين فقرات المقال تلقائيًا" },
  article_bottom: { title: "أسفل المقال", desc: "يظهر بعد نهاية المحتوى وقبل المقالات ذات الصلة" },
  sidebar: { title: "الشريط الجانبي", desc: "يظهر في صفحة المقال على الشاشات الكبيرة" },
  footer: { title: "أسفل الموقع", desc: "يظهر فوق التذييل في جميع صفحات الموقع" },
};
