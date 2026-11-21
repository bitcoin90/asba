import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { one, query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  try {
    const published = await one<{ c: number }>(
      "SELECT COUNT(*) AS c FROM posts WHERE status = 'published'"
    );
    const drafts = await one<{ c: number }>("SELECT COUNT(*) AS c FROM posts WHERE status = 'draft'");
    const scheduled = await one<{ c: number }>(
      "SELECT COUNT(*) AS c FROM posts WHERE status = 'scheduled'"
    );
    const totalViews = await one<{ v: number }>("SELECT COALESCE(SUM(views), 0) AS v FROM posts");
    const siteViews = await one<{ v: number }>("SELECT COALESCE(SUM(count), 0) AS v FROM views");
    const mediaCount = await one<{ c: number }>("SELECT COUNT(*) AS c FROM media");
    const categoriesCount = await one<{ c: number }>("SELECT COUNT(*) AS c FROM categories");
    const unreadMessages = await one<{ c: number }>(
      "SELECT COUNT(*) AS c FROM messages WHERE is_read = 0"
    );

    // مشاهدات آخر 14 يومًا
    const days = await query<{ day: string; count: number }>(
      `SELECT day, SUM(count) AS count FROM views
       WHERE stat_key LIKE '/post/%' AND day >= ?
       GROUP BY day ORDER BY day ASC`,
      [new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10)]
    );

    const topPosts = await query<{ title: string; slug: string; views: number }>(
      `SELECT title, slug, views FROM posts WHERE views > 0
       ORDER BY views DESC LIMIT 5`
    );

    return NextResponse.json({
      published: Number(published?.c ?? 0),
      drafts: Number(drafts?.c ?? 0),
      scheduled: Number(scheduled?.c ?? 0),
      postViews: Number(totalViews?.v ?? 0),
      siteViews: Number(siteViews?.v ?? 0),
      mediaCount: Number(mediaCount?.c ?? 0),
      categoriesCount: Number(categoriesCount?.c ?? 0),
      unreadMessages: Number(unreadMessages?.c ?? 0),
      daily: days.map((d) => ({ day: d.day, count: Number(d.count) })),
      topPosts,
    });
  } catch {
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
