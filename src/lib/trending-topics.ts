import "server-only";
import { logger } from "./logger";

/**
 * Pulls today's trending tech headlines from the Hacker News API (free, no
 * key, no auth — https://github.com/HackerNews/API) as inspiration for
 * auto-generated articles. This is "real current trends", not Gemini
 * guessing from training data, which is the whole point of the auto-generate
 * job (see AGENTS.md / PRD.md if those get updated — the cron route is the
 * caller of this).
 */
export type TrendingTopic = { title: string; url?: string };

const HN_TOP = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM = (id: number) =>
  `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

// Light relevance filter so "auto topic" stays inside AI/web dev/networking,
// matching the scope promised in PRD.md — not just "whatever is #1 on HN
// today" (which is often unrelated: finance, politics, general science).
const RELEVANT = [
  /\bai\b/i,
  /\bllm\b/i,
  /machine learning/i,
  /gpt|gemini|claude|anthropic|openai/i,
  /javascript|typescript|react|next\.?js|node\.?js|python|golang|rust|php|laravel/i,
  /database|postgres|sql|redis/i,
  /network|dns|tcp|http|protocol|api\b/i,
  /security|vulnerability|exploit|cve/i,
  /docker|kubernetes|container/i,
  /web\s?dev|frontend|backend|full-?stack/i,
];

export async function getTrendingTechTopic(): Promise<TrendingTopic | null> {
  try {
    const idsRes = await fetch(HN_TOP, { cache: "no-store" });
    if (!idsRes.ok) throw new Error(`HN top stories failed: ${idsRes.status}`);
    const ids: number[] = (await idsRes.json()).slice(0, 40);

    const items = await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(HN_ITEM(id), { cache: "no-store" });
          if (!res.ok) return null;
          return (await res.json()) as { title?: string; url?: string } | null;
        } catch {
          return null;
        }
      }),
    );

    const relevant = items.filter(
      (it): it is { title: string; url?: string } =>
        !!it?.title && RELEVANT.some((re) => re.test(it.title as string)),
    );

    if (relevant.length === 0) return null;
    const pick = relevant[Math.floor(Math.random() * relevant.length)];
    if (!pick) return null;
    return { title: pick.title, url: pick.url };
  } catch (err) {
    logger.warn("trending_topics_fetch_failed", {
      error: (err as Error).message,
    });
    return null;
  }
}
