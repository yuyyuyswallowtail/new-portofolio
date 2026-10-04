"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";
import {
  createArticleSchema,
  generateArticleSchema,
  regenerateSchema,
  updateArticleSchema,
} from "./schema";
import * as service from "./service";

export async function generateArticleAction(input: {
  topic?: string;
  withImage: boolean;
}) {
  const user = await getCurrentUser();
  const parsed = generateArticleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "Input tidak valid." };

  const result = await service.generateWithAi(user, parsed.data);
  if (result.ok) revalidatePath("/dashboard/articles");
  return result;
}

export async function runAutoGenerateAction(publish: boolean) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "articles.manage_any")) {
    return {
      ok: false as const,
      error: "Kamu tidak punya izin menjalankan auto-generate.",
    };
  }
  const result = await service.runAutoGenerate({
    publish,
    triggeredBy: "manual",
  });
  if (result.ok) {
    revalidatePath("/dashboard/articles");
    if (publish) {
      revalidatePath("/articles");
      revalidatePath("/");
    }
  }
  return result;
}

export async function createArticleAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = createArticleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "Input tidak valid." };

  const result = await service.createManual(user, parsed.data);
  if (result.ok) revalidatePath("/dashboard/articles");
  return result;
}

export async function updateArticleAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = updateArticleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "Input tidak valid." };

  const result = await service.updateManual(user, parsed.data);
  if (result.ok) {
    revalidatePath("/dashboard/articles");
    revalidatePath(`/articles/${result.data.slug}`);
  }
  return result;
}

export async function regenerateArticleAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = regenerateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
    };
  }
  const result = await service.regenerateWithFeedback(user, parsed.data);
  if (result.ok) {
    revalidatePath("/dashboard/articles");
    revalidatePath(`/articles/${result.data.slug}`);
  }
  return result;
}

export async function publishArticleAction(articleId: string) {
  const user = await getCurrentUser();
  const result = await service.publish(user, articleId);
  if (result.ok) {
    revalidatePath("/dashboard/articles");
    revalidatePath("/articles");
    revalidatePath("/");
  }
  return result;
}

export async function deleteArticleAction(articleId: string) {
  const user = await getCurrentUser();
  const result = await service.remove(user, articleId);
  if (result.ok) revalidatePath("/dashboard/articles");
  return result;
}
