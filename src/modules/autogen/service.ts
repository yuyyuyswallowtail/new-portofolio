import "server-only";
import { logger } from "@/lib/logger";
import { can, type Role } from "@/lib/rbac";
import { runAutoGenerate } from "@/modules/articles/service";
import {
  type AutoGenerateState,
  DEFAULT_INTERVAL_MINUTES,
  INTERVAL_OPTIONS,
  TEST_INTERVAL_MINUTES,
  TEST_RUNS,
} from "./options";
import * as repo from "./repository";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
type CurrentUser = { id: string; role: Role } | null;
type RunResult = Awaited<ReturnType<typeof runAutoGenerate>>;

// Kunci lebih lama dari maxDuration route (300 dtk) supaya proses yang mati tidak memblokir selamanya.
const LOCK_MS = 330_000;
// Kalau satu proses gagal, coba lagi lebih cepat daripada menunggu interval penuh.
const RETRY_MINUTES = 15;

const FORBIDDEN = {
  ok: false as const,
  error: "Kamu tidak punya izin mengatur auto-generate.",
};

function allowed(user: CurrentUser): user is NonNullable<CurrentUser> {
  return !!user && can(user.role, "articles.manage_any");
}

function toState(row: repo.Settings): AutoGenerateState {
  const now = Date.now();
  return {
    enabled: row.enabled,
    intervalMinutes: row.intervalMinutes,
    autoPublish: row.autoPublish,
    running: !!row.lockedUntil && row.lockedUntil.getTime() > now,
    nextRunAt: row.nextRunAt?.toISOString() ?? null,
    lastRunAt: row.lastRunAt?.toISOString() ?? null,
    lastStatus: row.lastStatus,
    lastMessage: row.lastMessage,
    testRunsLeft: row.testRunsLeft,
    serverNow: new Date(now).toISOString(),
  };
}

/** Catat hasil, lepas kunci, dan jadwalkan proses berikutnya (dihitung dari SEKARANG = saat selesai). */
async function finish(result: RunResult) {
  const latest = await repo.ensure(); // baca ulang: pengguna bisa mengubah pengaturan saat proses berjalan
  const now = new Date();
  const wasTest = latest.intervalMinutes === TEST_INTERVAL_MINUTES;
  const runsLeft = wasTest ? Math.max(0, latest.testRunsLeft - 1) : 0;
  const interval =
    wasTest && runsLeft === 0
      ? DEFAULT_INTERVAL_MINUTES
      : latest.intervalMinutes;
  const delayMinutes = result.ok ? interval : Math.min(interval, RETRY_MINUTES);

  await repo.patch({
    lockedUntil: null,
    lastRunAt: now,
    lastStatus: result.ok ? "ok" : "error",
    lastMessage: (result.ok
      ? `${result.data.topic} (/articles/${result.data.slug})`
      : result.error
    ).slice(0, 300),
    intervalMinutes: interval,
    testRunsLeft: runsLeft,
    nextRunAt: latest.enabled
      ? new Date(now.getTime() + delayMinutes * 60_000)
      : null,
  });
}

async function execute(
  settings: repo.Settings,
  triggeredBy: "cron" | "manual",
): Promise<RunResult> {
  let result: RunResult;
  try {
    result = await runAutoGenerate({
      publish: settings.autoPublish,
      triggeredBy,
    });
  } catch (err) {
    result = { ok: false, error: (err as Error).message };
  }
  logger.info("autogen_run_finished", {
    triggeredBy,
    ok: result.ok,
    publish: settings.autoPublish,
  });
  await finish(result);
  return result;
}

export async function getState(
  user: CurrentUser,
): Promise<ActionResult<AutoGenerateState>> {
  if (!allowed(user)) return FORBIDDEN;
  return { ok: true, data: toState(await repo.ensure()) };
}

export async function update(
  user: CurrentUser,
  input: { intervalMinutes?: number; autoPublish?: boolean },
): Promise<ActionResult<null>> {
  if (!allowed(user)) return FORBIDDEN;
  const cur = await repo.ensure();
  const values: Parameters<typeof repo.patch>[0] = {};

  if (input.autoPublish !== undefined) values.autoPublish = input.autoPublish;

  const next = input.intervalMinutes;
  if (next !== undefined && next !== cur.intervalMinutes) {
    if (!INTERVAL_OPTIONS.some((o) => o.minutes === next)) {
      return { ok: false, error: "Interval tidak valid." };
    }
    values.intervalMinutes = next;
    values.testRunsLeft = next === TEST_INTERVAL_MINUTES ? TEST_RUNS : 0;
    // Mengubah interval saat aktif memulai ulang hitungan mundur.
    if (cur.enabled) values.nextRunAt = new Date(Date.now() + next * 60_000);
  }
  await repo.patch(values);
  return { ok: true, data: null };
}

/** Aktifkan jadwal dan langsung bangkitkan satu artikel sekarang. */
export async function start(
  user: CurrentUser,
): Promise<ActionResult<{ topic: string; slug: string }>> {
  if (!allowed(user)) return FORBIDDEN;
  await repo.ensure();
  const claimed = await repo.claim({ due: false, lockMs: LOCK_MS });
  if (!claimed) {
    return {
      ok: false,
      error:
        "Sedang ada proses generate yang berjalan — tunggu sampai selesai.",
    };
  }
  // Selama proses berjalan, kunci menahan tick; nextRunAt di masa depan sebagai pengaman kedua.
  await repo.patch({
    enabled: true,
    testRunsLeft:
      claimed.intervalMinutes === TEST_INTERVAL_MINUTES ? TEST_RUNS : 0,
    nextRunAt: new Date(Date.now() + LOCK_MS),
  });

  const result = await execute(claimed, "manual");
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    data: { topic: result.data.topic, slug: result.data.slug },
  };
}

export async function stop(user: CurrentUser): Promise<ActionResult<null>> {
  if (!allowed(user)) return FORBIDDEN;
  await repo.ensure();
  await repo.patch({ enabled: false, nextRunAt: null });
  logger.info("autogen_stopped", { userId: user.id });
  return { ok: true, data: null };
}

// ---------- dipakai route cron (tick) ----------

export async function claimDue() {
  await repo.ensure();
  return repo.claim({ due: true, lockMs: LOCK_MS });
}

export function runClaimed(settings: repo.Settings) {
  return execute(settings, "cron");
}
