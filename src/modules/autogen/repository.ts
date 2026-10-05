import { and, eq, isNull, lt, lte, or } from "drizzle-orm";
import { db } from "@/db/client";
import { autoGenerateSettings as s } from "@/db/schema";

export type Settings = typeof s.$inferSelect;
const ROW_ID = 1;

/** Pastikan baris pengaturan ada. Default publish mengikuti env CRON_AUTO_PUBLISH sekali saja. */
export async function ensure(): Promise<Settings> {
  await db
    .insert(s)
    .values({
      id: ROW_ID,
      autoPublish: process.env.CRON_AUTO_PUBLISH === "true",
    })
    .onConflictDoNothing();
  const [row] = await db.select().from(s).where(eq(s.id, ROW_ID)).limit(1);
  if (!row) throw new Error("auto_generate_settings row missing");
  return row;
}

export async function patch(values: Partial<typeof s.$inferInsert>) {
  const [row] = await db
    .update(s)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(s.id, ROW_ID))
    .returning();
  return row ?? null;
}

/**
 * Klaim atomik (satu UPDATE): hanya satu pemanggil yang lolos, jadi dua tick
 * atau tombol dan tick tidak bisa membangkitkan artikel bersamaan.
 * due=true: harus aktif dan sudah jatuh tempo. due=false: cukup kunci bebas.
 */
export async function claim(opts: {
  due: boolean;
  lockMs: number;
}): Promise<Settings | null> {
  const now = new Date();
  const lockFree = or(isNull(s.lockedUntil), lt(s.lockedUntil, now));
  const where = opts.due
    ? and(
        eq(s.id, ROW_ID),
        eq(s.enabled, true),
        or(isNull(s.nextRunAt), lte(s.nextRunAt, now)),
        lockFree,
      )
    : and(eq(s.id, ROW_ID), lockFree);

  const [row] = await db
    .update(s)
    .set({
      lockedUntil: new Date(now.getTime() + opts.lockMs),
      updatedAt: now,
    })
    .where(where)
    .returning();
  return row ?? null;
}
