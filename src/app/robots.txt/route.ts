import { METADATA_BASE } from "@/lib/site";

export const dynamic = "force-dynamic";

// زواحف الذكاء الاصطناعي — سماح صريح لكل عناكب النماذج (استراتيجية GEO)
// GPTBot/OAI-SearchBot: OpenAI (ChatGPT Search) — PerplexityBot: Perplexity
// ClaudeBot/Claude-Search: Anthropic — Google-Extended: Gemini و AI Overviews
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Google-Extended",
  "GoogleOther",
  "ClaudeBot",
  "Claude-User",
  "Claude-Search",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "meta-externalagent",
  "FacebookBot",
  "Applebot",
  "Applebot-Extended",
  "Amazonbot",
  "YouBot",
  "cohere-ai",
  "Diffbot",
  "Bytespider",
];

export async function GET() {
  const base = await METADATA_BASE();
  const ai = AI_BOTS.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n");
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin

${ai}

Sitemap: ${base}sitemap.xml
`;
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
