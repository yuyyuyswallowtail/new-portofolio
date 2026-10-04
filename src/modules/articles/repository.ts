import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { articles, type NewArticle } from "@/db/schema";

export type ListFilters = {
  q?: string;
  status?: "draft" | "published";
  tag?: string;
  limit: number;
  offset: number;
};

function filtersToWhere(
  f: Pick<ListFilters, "q" | "status" | "tag">,
  publicOnly: boolean,
) {
  const conditions = [isNull(articles.deletedAt)];
  if (publicOnly) conditions.push(eq(articles.status, "published"));
  else if (f.status) conditions.push(eq(articles.status, f.status));

  if (f.q) {
    conditions.push(
      or(
        ilike(articles.title, `%${f.q}%`),
        ilike(articles.excerpt, `%${f.q}%`),
      ) as ReturnType<typeof eq>,
    );
  }
  if (f.tag) {
    conditions.push(sql`${f.tag} = ANY(${articles.tags})`);
  }
  return and(...conditions);
}

export async function listPublished(f: ListFilters) {
  return db
    .select()
    .from(articles)
    .where(filtersToWhere(f, true))
    .orderBy(desc(articles.publishedAt))
    .limit(f.limit)
    .offset(f.offset);
}

export async function countPublished(f: Pick<ListFilters, "q" | "tag">) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articles)
    .where(filtersToWhere(f, true));
  return row?.count ?? 0;
}

export async function listAllForDashboard(f: ListFilters) {
  return db
    .select()
    .from(articles)
    .where(filtersToWhere(f, false))
    .orderBy(desc(articles.createdAt))
    .limit(f.limit)
    .offset(f.offset);
}

export async function countForDashboard(
  f: Pick<ListFilters, "q" | "status" | "tag">,
) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articles)
    .where(filtersToWhere(f, false));
  return row?.count ?? 0;
}

export async function statusCounts() {
  const rows = await db
    .select({ status: articles.status, count: sql<number>`count(*)::int` })
    .from(articles)
    .where(isNull(articles.deletedAt))
    .groupBy(articles.status);
  return rows;
}

export async function aiGeneratedCount() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articles)
    .where(and(isNull(articles.deletedAt), eq(articles.aiGenerated, true)));
  return row?.count ?? 0;
}

export async function findBySlug(slug: string) {
  const rows = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), isNull(articles.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function findById(id: string) {
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function create(values: NewArticle) {
  const [row] = await db.insert(articles).values(values).returning();
  if (!row) throw new Error("Failed to insert article");
  return row;
}

export async function update(id: string, values: Partial<NewArticle>) {
  const [row] = await db
    .update(articles)
    .set(values)
    .where(eq(articles.id, id))
    .returning();
  return row ?? null;
}

export async function publish(id: string) {
  const [row] = await db
    .update(articles)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(articles.id, id))
    .returning();
  return row;
}

export async function softDelete(id: string) {
  await db
    .update(articles)
    .set({ deletedAt: new Date() })
    .where(eq(articles.id, id));
}

/** Slug dianggap terpakai walau artikelnya sudah di-soft-delete (constraint unik tetap berlaku). */
export async function slugExists(slug: string) {
  const rows = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);
  return rows.length > 0;
}
