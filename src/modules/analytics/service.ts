import "server-only";
import { gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  certifications,
  projects,
  sessions,
  skillEntries,
  users,
} from "@/db/schema";
import { cached } from "@/lib/cache";
import { getAnalytics as getArticleAnalytics } from "@/modules/articles/service";

export type DashboardAnalytics = {
  articles: {
    total: number;
    published: number;
    draft: number;
    aiGenerated: number;
  };
  content: { projects: number; certifications: number; skills: number };
  staff: { total: number; activeSessions: number };
};

async function countTable(
  tbl: typeof projects | typeof certifications | typeof skillEntries,
) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tbl)
    .where(isNull(tbl.deletedAt));
  return row?.count ?? 0;
}

/**
 * Powers the analytics bar shown on every /dashboard/* page (see
 * src/app/dashboard/layout.tsx). Cached briefly so navigating between admin
 * pages doesn't re-run 7 count queries on every click.
 */
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  return cached("dashboard:analytics", 15_000, async () => {
    const [
      articleStats,
      projectCount,
      certCount,
      skillCount,
      staffCount,
      activeSessions,
    ] = await Promise.all([
      getArticleAnalytics(),
      countTable(projects),
      countTable(certifications),
      countTable(skillEntries),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(sessions)
        .where(gt(sessions.expiresAt, new Date()))
        .then((r) => r[0]?.count ?? 0),
    ]);

    return {
      articles: articleStats,
      content: {
        projects: projectCount,
        certifications: certCount,
        skills: skillCount,
      },
      staff: { total: staffCount, activeSessions },
    };
  });
}
