import "server-only";
import { cached, invalidateCachePrefix } from "@/lib/cache";
import { moderateComment } from "@/lib/comment-moderation";
import { logger } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { can, type Role } from "@/lib/rbac";
import { findById as findArticleById } from "@/modules/articles/repository";
import type { CommentStatus } from "./repository";
import * as repo from "./repository";
import type { CreateCommentInput } from "./schema";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
type CurrentUser = { id: string; role: Role } | null;

const PENDING_CACHE = "comments:pending";
const FORBIDDEN = {
  ok: false as const,
  error: "Kamu tidak punya izin memoderasi komentar.",
};

function canModerate(user: CurrentUser): user is NonNullable<CurrentUser> {
  return !!user && can(user.role, "comments.moderate");
}

export async function listForArticle(articleId: string) {
  return repo.listForArticle(articleId);
}

export async function create(
  input: CreateCommentInput,
): Promise<ActionResult<{ held: boolean }>> {
  if (input.website) {
    // Honeypot kena — pura-pura sukses supaya bot tidak belajar mengosongkannya.
    logger.warn("comment_honeypot_tripped");
    return { ok: true, data: { held: false } };
  }

  const ip = await getClientIp();
  const limit = rateLimit(`comment:${ip}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.ok) {
    return {
      ok: false,
      error: "Terlalu banyak komentar dari IP ini — coba lagi nanti.",
    };
  }

  const article = await findArticleById(input.articleId);
  if (!article || article.deletedAt || article.status !== "published") {
    return { ok: false, error: "Artikel tidak ditemukan." };
  }

  const verdict = await moderateComment({
    authorName: input.authorName,
    body: input.body,
  });

  await repo.create({
    articleId: input.articleId,
    authorName: input.authorName,
    authorEmail: input.authorEmail || null,
    body: input.body,
    status: verdict.status,
    flagReason: verdict.reason,
  });
  invalidateCachePrefix(PENDING_CACHE);
  logger.info("comment_created", {
    articleId: input.articleId,
    ip,
    status: verdict.status,
    reason: verdict.reason,
  });
  return { ok: true, data: { held: verdict.status !== "approved" } };
}

/** Dipakai tombol "delete" di halaman artikel (khusus staff). */
export async function remove(
  user: CurrentUser,
  commentId: string,
): Promise<ActionResult<null>> {
  if (!canModerate(user)) return FORBIDDEN;
  await repo.softDelete(commentId);
  invalidateCachePrefix(PENDING_CACHE);
  logger.info("comment_deleted", { commentId, userId: user.id });
  return { ok: true, data: null };
}

// ---------- moderasi (dashboard) ----------

export async function listForModeration(
  user: CurrentUser,
  query: { status?: CommentStatus; q?: string; page: number; pageSize: number },
) {
  if (!canModerate(user)) return null;
  const filters = { status: query.status, q: query.q };
  const [items, total] = await Promise.all([
    repo.listForModeration({
      ...filters,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    }),
    repo.countForModeration(filters),
  ]);
  return { items, total };
}

export async function moderationCounts(user: CurrentUser) {
  if (!canModerate(user)) return null;
  const counts: Record<CommentStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
    spam: 0,
  };
  for (const row of await repo.statusCounts()) counts[row.status] = row.count;
  return counts;
}

export async function pendingCount(): Promise<number> {
  return cached(PENDING_CACHE, 15_000, () => repo.countPending());
}

export async function setStatus(
  user: CurrentUser,
  ids: string[],
  status: CommentStatus,
): Promise<ActionResult<{ updated: number }>> {
  if (!canModerate(user)) return FORBIDDEN;
  const updated = await repo.setStatus(ids, status);
  invalidateCachePrefix(PENDING_CACHE);
  logger.info("comments_moderated", { userId: user.id, status, updated });
  return { ok: true, data: { updated } };
}

export async function updateBody(
  user: CurrentUser,
  id: string,
  body: string,
): Promise<ActionResult<null>> {
  if (!canModerate(user)) return FORBIDDEN;
  const ok = await repo.updateBody(id, body);
  if (!ok) return { ok: false, error: "Komentar tidak ditemukan." };
  logger.info("comment_edited", { commentId: id, userId: user.id });
  return { ok: true, data: null };
}

export async function removeMany(
  user: CurrentUser,
  ids: string[],
): Promise<ActionResult<{ deleted: number }>> {
  if (!canModerate(user)) return FORBIDDEN;
  const deleted = await repo.softDeleteMany(ids);
  invalidateCachePrefix(PENDING_CACHE);
  logger.info("comments_deleted", { userId: user.id, deleted });
  return { ok: true, data: { deleted } };
}
