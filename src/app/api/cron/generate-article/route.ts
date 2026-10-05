import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { runAutoGenerate } from "@/modules/articles/service";

export const runtime = "nodejs";
// Generate artikel + gambar bisa lama. 60 detik adalah batas aman di plan Hobby.
export const maxDuration = 60;

/**
 * Dipanggil oleh Vercel Cron (GET + header `Authorization: Bearer <CRON_SECRET>`)
 * atau oleh service `cron` di docker-compose (POST + header `x-cron-secret`).
 * Auth memakai shared secret, bukan session user. Tidak ada header CORS.
 */
async function handle(request: Request) {
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

  const auth = request.headers.get("authorization");
  const provided =
    request.headers.get("x-cron-secret") ??
    (auth?.startsWith("Bearer ") ? auth.slice(7) : null);
  if (provided !== secret) {
    logger.warn("cron_generate_unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Catatan: rate limit ini in-memory, jadi hanya efektif per instance.
  // Di serverless ia hanya jaring pengaman tambahan, bukan jaminan.
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

export const GET = handle;
export const POST = handle;
