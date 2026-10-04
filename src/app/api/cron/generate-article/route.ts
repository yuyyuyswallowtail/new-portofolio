import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { runAutoGenerate } from "@/modules/articles/service";

export const runtime = "nodejs";

/**
 * Called by the `cron` service in docker-compose.yml on a schedule (see
 * CRON_SCHEDULE_HOURS in .env). Auth is a shared secret header, not a user
 * session — this route is never meant to be hit from a browser, so no CORS
 * headers are set (default same-origin-only is irrelevant for server-to-
 * server calls, and we don't want to accidentally make this browser-callable
 * from another origin).
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error("cron_generate_misconfigured", {
      reason: "CRON_SECRET not set",
    });
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  const provided = request.headers.get("x-cron-secret");
  if (provided !== secret) {
    logger.warn("cron_generate_unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Extra safety net even though the secret already gates this: a
  // misconfigured crontab (e.g. "every minute" instead of "every N hours")
  // should not be able to burn through the Gemini quota.
  const limit = rateLimit("cron-generate-article", {
    limit: 1,
    windowMs: 25 * 60 * 1000,
  });
  if (!limit.ok) {
    logger.warn("cron_generate_rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const publish = process.env.CRON_AUTO_PUBLISH === "true";
  const result = await runAutoGenerate({ publish, triggeredBy: "cron" });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, ...result.data });
}
