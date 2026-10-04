import "server-only";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  articles,
  certifications,
  education,
  experiences,
  projects,
  skillEntries,
} from "@/db/schema";
import { getOwnerProfile } from "@/modules/content/repository";

export type WeeklyPoint = { week: string; count: number };
export type ChecklistItem = {
  label: string;
  done: boolean;
  href: string;
  hint?: string;
};

const total = sql<number>`count(*)::int`;

async function countRows(query: PromiseLike<{ count: number }[]>) {
  return (await query)[0]?.count ?? 0;
}

/** Jumlah artikel dibuat per minggu (8 minggu terakhir, minggu kosong tetap muncul). */
export async function getWeeklyArticleActivity(): Promise<WeeklyPoint[]> {
  const rows = (await db.execute(sql`
    select to_char(w.week, 'YYYY-MM-DD') as week, count(a.id)::int as count
    from generate_series(
      date_trunc('week', now()) - interval '7 weeks',
      date_trunc('week', now()),
      interval '1 week'
    ) as w(week)
    left join articles a
      on a.deleted_at is null
     and a.created_at >= w.week
     and a.created_at < w.week + interval '1 week'
    group by w.week
    order by w.week
  `)) as unknown as { week: string; count: number }[];
  return Array.from(rows).map((r) => ({
    week: r.week,
    count: Number(r.count),
  }));
}

export async function getLastAiArticleAt(): Promise<Date | null> {
  const [row] = await db
    .select({ createdAt: articles.createdAt })
    .from(articles)
    .where(and(isNull(articles.deletedAt), eq(articles.aiGenerated, true)))
    .orderBy(desc(articles.createdAt))
    .limit(1);
  return row?.createdAt ?? null;
}

/** Checklist kelengkapan konten portfolio, tiap item menunjuk ke halaman perbaikannya. */
export async function getContentChecklist(): Promise<ChecklistItem[]> {
  const owner = await getOwnerProfile();
  if (!owner) return [];

  const eduBase = and(
    eq(education.userId, owner.id),
    isNull(education.deletedAt),
  );
  const expBase = and(
    eq(experiences.userId, owner.id),
    isNull(experiences.deletedAt),
  );
  const skillBase = and(
    eq(skillEntries.userId, owner.id),
    isNull(skillEntries.deletedAt),
  );
  const projBase = and(
    eq(projects.userId, owner.id),
    isNull(projects.deletedAt),
  );
  const certBase = and(
    eq(certifications.userId, owner.id),
    isNull(certifications.deletedAt),
  );

  const [eduN, expN, skillN, projN, projNoImg, certN, certNoImg] =
    await Promise.all([
      countRows(db.select({ count: total }).from(education).where(eduBase)),
      countRows(db.select({ count: total }).from(experiences).where(expBase)),
      countRows(
        db.select({ count: total }).from(skillEntries).where(skillBase),
      ),
      countRows(db.select({ count: total }).from(projects).where(projBase)),
      countRows(
        db
          .select({ count: total })
          .from(projects)
          .where(
            and(
              projBase,
              or(isNull(projects.imageUrl), eq(projects.imageUrl, "")),
            ),
          ),
      ),
      countRows(
        db.select({ count: total }).from(certifications).where(certBase),
      ),
      countRows(
        db
          .select({ count: total })
          .from(certifications)
          .where(
            and(
              certBase,
              or(
                isNull(certifications.imageUrl),
                eq(certifications.imageUrl, ""),
              ),
            ),
          ),
      ),
    ]);

  return [
    {
      label: "Bio terisi",
      done: !!owner.bio?.trim(),
      href: "/dashboard/profile",
    },
    {
      label: "LinkedIn dan GitHub terisi",
      done: !!owner.linkedinUrl && !!owner.githubUsername,
      href: "/dashboard/profile",
    },
    { label: "Education", done: eduN > 0, href: "/dashboard/education" },
    { label: "Experience", done: expN > 0, href: "/dashboard/experience" },
    { label: "Skills", done: skillN > 0, href: "/dashboard/skills" },
    { label: "Projects", done: projN > 0, href: "/dashboard/projects" },
    {
      label: "Semua project punya gambar",
      done: projN > 0 && projNoImg === 0,
      href: "/dashboard/projects",
      hint: projNoImg > 0 ? `${projNoImg} project tanpa gambar` : undefined,
    },
    {
      label: "Semua sertifikat punya gambar",
      done: certN > 0 && certNoImg === 0,
      href: "/dashboard/certifications",
      hint:
        certN === 0
          ? "belum ada sertifikat"
          : certNoImg > 0
            ? `${certNoImg} sertifikat tanpa gambar`
            : undefined,
    },
  ];
}
