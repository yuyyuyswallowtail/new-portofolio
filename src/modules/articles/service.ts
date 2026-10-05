import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { generateArticleImages } from "@/lib/article-images";
import { cached, invalidateCachePrefix } from "@/lib/cache";
import { generateArticle, regenerateArticle } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import { htmlToPlainText, markdownToHtml } from "@/lib/markdown";
import { rateLimit } from "@/lib/rate-limit";
import { can, canEditArticle, type Role } from "@/lib/rbac";
import { getTrendingTechTopic } from "@/lib/trending-topics";
import { slugify } from "@/lib/utils";
import * as repo from "./repository";
import type {
  CreateArticleInput,
  GenerateArticleInput,
  ListQueryInput,
  RegenerateInput,
  UpdateArticleInput,
} from "./schema";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
type CurrentUser = { id: string; role: Role } | null;

const PUBLIC_CACHE_PREFIX = "articles:public:";
const PUBLIC_CACHE_TTL_MS = 30_000; // see lib/cache.ts — single-instance, short TTL

// Anggaran waktu total (sejak mulai) untuk generate + gambar, di bawah batas
// maxDuration (dashboard 120 detik, cron 60 detik). Kalau gambar tidak sempat
// selesai, artikel tetap disimpan tanpa gambar.
const MANUAL_BUDGET_MS = 100_000;
const CRON_BUDGET_MS = 50_000;
const MIN_IMAGE_BUDGET_MS = 10_000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timeout setelah ${ms}ms`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "article";
  let attempt = 0;
  while (await repo.slugExists(slug)) {
    attempt += 1;
    slug = `${slugify(base)}-${attempt}`;
    if (attempt > 20) break;
  }
  return slug;
}

function pageToOffset(page: number, pageSize: number) {
  return (page - 1) * pageSize;
}

// ---------- Public reads (cached — see ARCHITECTURE.md §7 on why these pages
// are force-dynamic, not ISR; this cache is what keeps that from hammering
// Postgres on every visitor) ----------

export async function listPublic(
  query: Pick<ListQueryInput, "q" | "tag" | "page" | "pageSize">,
) {
  const key = `${PUBLIC_CACHE_PREFIX}${JSON.stringify(query)}`;
  return cached(key, PUBLIC_CACHE_TTL_MS, async () => {
    const limit = query.pageSize;
    const offset = pageToOffset(query.page, query.pageSize);
    const [items, total] = await Promise.all([
      repo.listPublished({ q: query.q, tag: query.tag, limit, offset }),
      repo.countPublished({ q: query.q, tag: query.tag }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  });
}

export async function listRecentForHome(limit = 3) {
  const key = `${PUBLIC_CACHE_PREFIX}recent:${limit}`;
  return cached(key, PUBLIC_CACHE_TTL_MS, () =>
    repo.listPublished({ limit, offset: 0 }),
  );
}

export async function getBySlug(slug: string) {
  return repo.findBySlug(slug);
}

export async function getById(user: CurrentUser, articleId: string) {
  if (!user) return null;
  const article = await repo.findById(articleId);
  if (!article) return null;
  // Editors may only open their own articles; staff can open anything.
  if (!can(user.role, "articles.manage_any") && article.authorId !== user.id)
    return null;
  return article;
}

// ---------- Dashboard reads ----------

export async function listForDashboard(
  user: CurrentUser,
  query: Pick<ListQueryInput, "q" | "tag" | "status" | "page" | "pageSize">,
) {
  if (!user) return { items: [], total: 0, page: 1, pageSize: query.pageSize };
  const limit = query.pageSize;
  const offset = pageToOffset(query.page, query.pageSize);
  const [items, total] = await Promise.all([
    repo.listAllForDashboard({
      q: query.q,
      tag: query.tag,
      status: query.status,
      limit,
      offset,
    }),
    repo.countForDashboard({
      q: query.q,
      tag: query.tag,
      status: query.status,
    }),
  ]);
  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function getAnalytics() {
  const [statusRows, aiCount] = await Promise.all([
    repo.statusCounts(),
    repo.aiGeneratedCount(),
  ]);
  const published =
    statusRows.find((r) => r.status === "published")?.count ?? 0;
  const draft = statusRows.find((r) => r.status === "draft")?.count ?? 0;
  return { published, draft, total: published + draft, aiGenerated: aiCount };
}

// ---------- Mutations ----------

export async function createManual(
  user: CurrentUser,
  input: CreateArticleInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  if (!user || !can(user.role, "articles.create")) {
    return { ok: false, error: "Kamu tidak punya izin membuat artikel." };
  }
  const slug = await uniqueSlug(input.title);
  const row = await repo.create({
    authorId: user.id,
    slug,
    title: input.title,
    excerpt: input.excerpt ?? input.title,
    contentMd: input.contentMd,
    tags: input.tags,
    coverImageUrl: input.coverImageUrl,
    status: "draft",
    aiGenerated: false,
  });
  logger.info("article_created_manual", { articleId: row.id, userId: user.id });
  return { ok: true, data: { id: row.id, slug: row.slug } };
}

export async function updateManual(
  user: CurrentUser,
  input: UpdateArticleInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const article = await repo.findById(input.id);
  if (!article) return { ok: false, error: "Artikel tidak ditemukan." };
  if (
    !canEditArticle(user, article) &&
    !can(user?.role ?? null, "articles.manage_any")
  ) {
    return { ok: false, error: "Kamu tidak punya izin mengedit artikel ini." };
  }

  // Slug stays stable unless the title actually changed (don't break
  // existing published links on every trivial edit).
  const slug =
    article.title === input.title
      ? article.slug
      : await uniqueSlug(input.title);

  const row = await repo.update(input.id, {
    title: input.title,
    slug,
    excerpt: input.excerpt ?? input.title,
    contentMd: input.contentMd,
    tags: input.tags,
    coverImageUrl: input.coverImageUrl,
  });
  if (!row) return { ok: false, error: "Gagal menyimpan perubahan." };

  if (article.status === "published")
    invalidateCachePrefix(PUBLIC_CACHE_PREFIX);
  logger.info("article_updated", { articleId: row.id, userId: user?.id });
  return { ok: true, data: { id: row.id, slug: row.slug } };
}

/**
 * "Regenerate with feedback" — a human reviews an AI draft, writes what to
 * fix ("terlalu teknis", "kurang contoh kode", dll), and Gemini rewrites the
 * same article in place (same id/slug, still a draft). Rate-limited like
 * generateWithAi since it's another metered API call.
 */
export async function regenerateWithFeedback(
  user: CurrentUser,
  input: RegenerateInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const article = await repo.findById(input.id);
  if (!article) return { ok: false, error: "Artikel tidak ditemukan." };
  if (
    !canEditArticle(user, article) &&
    !can(user?.role ?? null, "articles.manage_any")
  ) {
    return { ok: false, error: "Kamu tidak punya izin mengedit artikel ini." };
  }
  if (!user) return { ok: false, error: "Tidak terautentikasi." };

  const limit = rateLimit(`ai-regenerate:${user.id}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return {
      ok: false,
      error: "Terlalu banyak percobaan regenerate — coba lagi nanti.",
    };
  }

  let regenerated: Awaited<ReturnType<typeof regenerateArticle>>;
  try {
    regenerated = await regenerateArticle(
      { title: article.title, contentMd: htmlToPlainText(article.contentMd) },
      input.feedback,
    );
  } catch (err) {
    logger.error("ai_regenerate_failed", {
      articleId: article.id,
      error: (err as Error).message,
    });
    return { ok: false, error: `Gagal regenerate: ${(err as Error).message}` };
  }

  const row = await repo.update(article.id, {
    title: regenerated.title,
    excerpt: regenerated.excerpt,
    contentMd: markdownToHtml(regenerated.contentMd),
    tags: regenerated.tags,
  });
  if (!row) return { ok: false, error: "Gagal menyimpan hasil regenerate." };

  logger.info("ai_regenerate_success", { articleId: row.id, userId: user.id });
  return { ok: true, data: { id: row.id, slug: row.slug } };
}

/**
 * The "Generate with AI" flow: writes the article body with the model from GEMINI_TEXT_MODEL,
 * optionally a cover image (Gemini, Pollinations, or local SVG fallback), saves it as a draft. A human (admin/super_admin, or the editor
 * who owns it) still has to publish it — AI never publishes directly, see
 * PRD.md §5.2 A9. Rate-limited per user: AI generation hits a metered API.
 *
 * Gambar dibatasi anggaran waktu (MANUAL_BUDGET_MS): kalau tidak sempat,
 * artikel tetap disimpan sebagai draft tanpa gambar.
 */
export async function generateWithAi(
  user: CurrentUser,
  input: GenerateArticleInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  if (!user || !can(user.role, "articles.create")) {
    return { ok: false, error: "Kamu tidak punya izin membuat artikel." };
  }

  const startedAt = Date.now();

  const limit = rateLimit(`ai-generate:${user.id}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    const minutes = Math.ceil((limit.resetAt - Date.now()) / 60000);
    logger.warn("ai_generate_rate_limited", { userId: user.id });
    return {
      ok: false,
      error: `Terlalu banyak percobaan generate AI — coba lagi dalam ${minutes} menit.`,
    };
  }

  let generated: Awaited<ReturnType<typeof generateArticle>>;
  try {
    generated = await generateArticle(input.topic);
  } catch (err) {
    logger.error("ai_generate_text_failed", {
      userId: user.id,
      error: (err as Error).message,
    });
    return {
      ok: false,
      error: `Gagal generate artikel: ${(err as Error).message}`,
    };
  }

  let coverImageUrl: string | undefined;
  if (input.withImage) {
    const remaining = MANUAL_BUDGET_MS - (Date.now() - startedAt);
    if (remaining < MIN_IMAGE_BUDGET_MS) {
      logger.warn("ai_generate_image_skipped", {
        userId: user.id,
        remainingMs: remaining,
      });
    } else {
      try {
        const imgs = await withTimeout(
          generateArticleImages(generated),
          remaining,
          "generateArticleImages",
        );
        coverImageUrl = imgs.coverImageUrl;
        generated.contentMd = imgs.contentMd;
      } catch (err) {
        logger.warn("ai_generate_image_failed", {
          userId: user.id,
          error: (err as Error).message,
        });
      }
    }
  }

  const slug = await uniqueSlug(generated.title);
  const row = await repo.create({
    authorId: user.id,
    slug,
    title: generated.title,
    excerpt: generated.excerpt,
    contentMd: markdownToHtml(generated.contentMd),
    tags: generated.tags,
    coverImageUrl,
    status: "draft",
    aiGenerated: true,
  });
  logger.info("ai_generate_success", { userId: user.id, articleId: row.id });
  return { ok: true, data: { id: row.id, slug: row.slug } };
}

/**
 * Same generation pipeline as generateWithAi, but attributed to the first
 * super_admin (there's no logged-in session: this runs from either the cron
 * route in src/app/api/cron/generate-article or the "Run now" dashboard
 * button). Topic comes from getTrendingTechTopic() when available, falling
 * back to a random AI/web-dev/networking topic like the manual flow.
 *
 * Anggaran waktu gambar lebih ketat untuk cron (route-nya maxDuration 60 detik).
 */
export async function runAutoGenerate(options: {
  publish: boolean;
  triggeredBy: "cron" | "manual";
}): Promise<ActionResult<{ id: string; slug: string; topic: string }>> {
  const startedAt = Date.now();
  const budgetMs =
    options.triggeredBy === "cron" ? CRON_BUDGET_MS : MANUAL_BUDGET_MS;

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.role, "super_admin"))
    .limit(1);
  if (!owner) {
    return {
      ok: false,
      error: "No super_admin user found — run seed:admin first.",
    };
  }

  const trend = await getTrendingTechTopic();
  const topic = trend
    ? `${trend.title} (and what it means for practicing developers)`
    : undefined;

  let generated: Awaited<ReturnType<typeof generateArticle>>;
  try {
    generated = await generateArticle(topic);
  } catch (err) {
    logger.error("auto_generate_text_failed", {
      triggeredBy: options.triggeredBy,
      error: (err as Error).message,
    });
    return {
      ok: false,
      error: `Gagal generate artikel: ${(err as Error).message}`,
    };
  }

  let coverImageUrl: string | undefined;
  const remaining = budgetMs - (Date.now() - startedAt);
  if (remaining < MIN_IMAGE_BUDGET_MS) {
    logger.warn("auto_generate_image_skipped", {
      triggeredBy: options.triggeredBy,
      remainingMs: remaining,
    });
  } else {
    try {
      const imgs = await withTimeout(
        generateArticleImages(generated),
        remaining,
        "generateArticleImages",
      );
      coverImageUrl = imgs.coverImageUrl;
      generated.contentMd = imgs.contentMd;
    } catch (err) {
      logger.warn("auto_generate_image_failed", {
        error: (err as Error).message,
      });
    }
  }

  const slug = await uniqueSlug(generated.title);
  const row = await repo.create({
    authorId: owner.id,
    slug,
    title: generated.title,
    excerpt: generated.excerpt,
    contentMd: markdownToHtml(generated.contentMd),
    tags: generated.tags,
    coverImageUrl,
    status: options.publish ? "published" : "draft",
    aiGenerated: true,
    publishedAt: options.publish ? new Date() : undefined,
  });

  if (options.publish) invalidateCachePrefix(PUBLIC_CACHE_PREFIX);
  logger.info("auto_generate_success", {
    triggeredBy: options.triggeredBy,
    articleId: row.id,
    topic: topic ?? "(random)",
    published: options.publish,
  });
  return {
    ok: true,
    data: { id: row.id, slug: row.slug, topic: topic ?? "(random)" },
  };
}

export async function publish(
  user: CurrentUser,
  articleId: string,
): Promise<ActionResult<null>> {
  const article = await repo.findById(articleId);
  if (!article) return { ok: false, error: "Artikel tidak ditemukan." };
  if (!user || !can(user.role, "articles.publish")) {
    return {
      ok: false,
      error: "Kamu tidak punya izin mempublikasikan artikel.",
    };
  }
  await repo.publish(articleId);
  invalidateCachePrefix(PUBLIC_CACHE_PREFIX);
  logger.info("article_published", { articleId, userId: user.id });
  return { ok: true, data: null };
}

export async function remove(
  user: CurrentUser,
  articleId: string,
): Promise<ActionResult<null>> {
  const article = await repo.findById(articleId);
  if (!article) return { ok: false, error: "Artikel tidak ditemukan." };
  if (
    !canEditArticle(user, article) &&
    !can(user?.role ?? null, "articles.manage_any")
  ) {
    return { ok: false, error: "Kamu tidak punya izin menghapus artikel ini." };
  }
  await repo.softDelete(articleId);
  invalidateCachePrefix(PUBLIC_CACHE_PREFIX);
  logger.info("article_deleted", { articleId, userId: user?.id });
  return { ok: true, data: null };
}
