import type { NextConfig } from "next";

// روابط مختصرة للصفحات الثابتة: /about → /page/about وهكذا
const PAGE_SLUGS = ["about", "contact", "privacy", "terms", "disclaimer", "works"];
const pageRedirects = PAGE_SLUGS.map((slug) => ({
  source: `/${slug}`,
  destination: `/page/${slug}`,
  permanent: true,
}));

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "pg"],
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return pageRedirects;
  },
};

export default nextConfig;
