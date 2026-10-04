import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db/client";
import { articles, comments } from "@/db/schema";

export type CommentStatus = "pending" | "approved" | "rejected" | "spam";
type NewComment = typeof comments.$inferInsert;

/** Hanya komentar approved yang tampil di halaman publik. */
export async function listForArticle(articleId: string) {
  return db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.articleId, articleId),
        eq(comments.status, "approved"),
        isNull(comments.deletedAt),
      ),
    )
    .orderBy(asc(comments.createdAt));
}

export async function create(values: NewComment) {
  const [row] = await db.insert(comments).values(values).returning();
  if (!row) throw new Error("Failed to insert comment");
  return row;
}

export async function softDelete(id: string) {
  await db
    .update(comments)
    .set({ deletedAt: new Date() })
    .where(eq(comments.id, id));
}

// ---------- moderasi ----------

type ModerationFilters = { status?: CommentStatus; q?: string };

function moderationWhere(f: ModerationFilters) {
  const conditions = [isNull(comments.deletedAt)];
  if (f.status) conditions.push(eq(comments.status, f.status));
  if (f.q) {
    conditions.push(
      or(
        ilike(comments.body, `%${f.q}%`),
        ilike(comments.authorName, `%${f.q}%`),
        ilike(comments.authorEmail, `%${f.q}%`),
      ) as ReturnType<typeof eq>,
    );
  }
  return and(...conditions);
}

export async function listForModeration(
  f: ModerationFilters & { limit: number; offset: number },
) {
  return db
    .select({
      id: comments.id,
      authorName: comments.authorName,
      authorEmail: comments.authorEmail,
      body: comments.body,
      status: comments.status,
      flagReason: comments.flagReason,
      createdAt: comments.createdAt,
      articleTitle: articles.title,
      articleSlug: articles.slug,
    })
    .from(comments)
    .innerJoin(articles, eq(comments.articleId, articles.id))
    .where(moderationWhere(f))
    .orderBy(desc(comments.createdAt))
    .limit(f.limit)
    .offset(f.offset);
}

export async function countForModeration(f: ModerationFilters) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(comments)
    .where(moderationWhere(f));
  return row?.count ?? 0;
}

export async function statusCounts() {
  return db
    .select({ status: comments.status, count: sql<number>`count(*)::int` })
    .from(comments)
    .where(isNull(comments.deletedAt))
    .groupBy(comments.status);
}

export async function countPending() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(comments)
    .where(and(eq(comments.status, "pending"), isNull(comments.deletedAt)));
  return row?.count ?? 0;
}

export async function setStatus(ids: string[], status: CommentStatus) {
  const rows = await db
    .update(comments)
    .set({ status, moderatedAt: new Date() })
    .where(and(inArray(comments.id, ids), isNull(comments.deletedAt)))
    .returning({ id: comments.id });
  return rows.length;
}

export async function updateBody(id: string, body: string) {
  const rows = await db
    .update(comments)
    .set({ body, moderatedAt: new Date() })
    .where(and(eq(comments.id, id), isNull(comments.deletedAt)))
    .returning({ id: comments.id });
  return rows.length > 0;
}

export async function softDeleteMany(ids: string[]) {
  const rows = await db
    .update(comments)
    .set({ deletedAt: new Date() })
    .where(and(inArray(comments.id, ids), isNull(comments.deletedAt)))
    .returning({ id: comments.id });
  return rows.length;
}
