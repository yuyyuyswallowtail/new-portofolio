import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { articles, type NewArticle } from "@/db/schema";

export async function listPublished() {
  return db
    .select()
    .from(articles)
    .where(and(eq(articles.status, "published"), isNull(articles.deletedAt)))
    .orderBy(desc(articles.publishedAt));
}

export async function listAllForDashboard() {
  return db
    .select()
    .from(articles)
    .where(isNull(articles.deletedAt))
    .orderBy(desc(articles.createdAt));
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
