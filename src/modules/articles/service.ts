import "server-only";
import { generateArticle, generateCoverImage } from "@/lib/gemini";
import { can, canEditArticle, type Role } from "@/lib/rbac";
import { slugify } from "@/lib/utils";
import * as repo from "./repository";
import type { CreateArticleInput, GenerateArticleInput } from "./schema";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
type CurrentUser = { id: string; role: Role } | null;

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "article";
  let attempt = 0;
  // small, bounded loop — this is a portfolio blog, not a high-write system
  while (await repo.findBySlug(slug)) {
    attempt += 1;
    slug = `${slugify(base)}-${attempt}`;
    if (attempt > 20) break;
  }
  return slug;
}

export async function listPublic() {
  return repo.listPublished();
}

export async function listForDashboard(user: CurrentUser) {
  if (!user) return [];
  return repo.listAllForDashboard();
}

export async function getBySlug(slug: string) {
  return repo.findBySlug(slug);
}

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
  return { ok: true, data: { id: row.id, slug: row.slug } };
}

/**
 * The "Generate with AI" flow: writes the article body with Gemini 2.5 Flash,
 * optionally a cover image with Gemini 2.5 Flash Image ("Nano Banana"), saves
 * it as a draft. A human (admin/super_admin, or the editor who owns it) still
 * has to publish it — AI never publishes directly, see PRD.md §5.2 A9.
 */
export async function generateWithAi(
  user: CurrentUser,
  input: GenerateArticleInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  if (!user || !can(user.role, "articles.create")) {
    return { ok: false, error: "Kamu tidak punya izin membuat artikel." };
  }

  let generated: Awaited<ReturnType<typeof generateArticle>>;
  try {
    generated = await generateArticle(input.topic);
  } catch (err) {
    return {
      ok: false,
      error: `Gagal generate artikel: ${(err as Error).message}`,
    };
  }

  let coverImageUrl: string | undefined;
  if (input.withImage) {
    try {
      coverImageUrl = await generateCoverImage(generated.title);
    } catch (err) {
      // Non-fatal — ship the article without a cover rather than losing the
      // generated text (image free-tier quota is the most likely failure).
      console.error("[articles] cover image generation failed:", err);
    }
  }

  const slug = await uniqueSlug(generated.title);
  const row = await repo.create({
    authorId: user.id,
    slug,
    title: generated.title,
    excerpt: generated.excerpt,
    contentMd: generated.contentMd,
    tags: generated.tags,
    coverImageUrl,
    status: "draft",
    aiGenerated: true,
  });
  return { ok: true, data: { id: row.id, slug: row.slug } };
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
  return { ok: true, data: null };
}
