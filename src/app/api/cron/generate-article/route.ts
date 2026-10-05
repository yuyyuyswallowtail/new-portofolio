import { after, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { claimDue, runClaimed } from "@/modules/autogen/service";

export const runtime = "nodejs";
// Generate artikel + gambar bisa lama (sekitar 3 menit).
export const maxDuration = 300;

/**
 * Ticker: dipanggil tiap menit (Vercel Cron di plan Pro, atau pg_cron di
 * Supabase) dengan GET + `Authorization: Bearer <CRON_SECRET>`, atau POST +
 * header `x-cron-secret`. Route ini TIDAK selalu membangkitkan artikel: ia
 * hanya jalan kalau pengaturan di database aktif dan waktunya sudah tiba, dan
 * kunci atomik di database mencegah dua proses berjalan bersamaan.
 * Responsnya 202 segera; pekerjaan berat lanjut lewat after().
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

  let claimed: Awaited<ReturnType<typeof claimDue>>;
  try {
    claimed = await claimDue();
  } catch (err) {
    logger.error("autogen_claim_failed", { error: (err as Error).message });
    return NextResponse.json({ error: "claim_failed" }, { status: 500 });
  }
  if (!claimed) return NextResponse.json({ ok: true, skipped: true });

  after(async () => {
    try {
      await runClaimed(claimed);
    } catch (err) {
      logger.error("autogen_tick_failed", { error: (err as Error).message });
    }
  });
  return NextResponse.json({ ok: true, started: true }, { status: 202 });
}

export const GET = handle;
export const POST = handle;
