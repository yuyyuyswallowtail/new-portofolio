"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { createArticleSchema, generateArticleSchema } from "./schema";
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

export async function createArticleAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = createArticleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "Input tidak valid." };

  const result = await service.createManual(user, parsed.data);
  if (result.ok) revalidatePath("/dashboard/articles");
  return result;
}

export async function publishArticleAction(articleId: string) {
  const user = await getCurrentUser();
  const result = await service.publish(user, articleId);
  if (result.ok) {
    revalidatePath("/dashboard/articles");
    revalidatePath("/articles");
  }
  return result;
}

export async function deleteArticleAction(articleId: string) {
  const user = await getCurrentUser();
  const result = await service.remove(user, articleId);
  if (result.ok) revalidatePath("/dashboard/articles");
  return result;
}
