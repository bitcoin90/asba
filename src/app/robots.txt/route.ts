import { METADATA_BASE } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = await METADATA_BASE();
  const body = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${base}sitemap.xml
`;
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
