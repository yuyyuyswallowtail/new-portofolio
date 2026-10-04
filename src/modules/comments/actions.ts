"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import {
  commentIdsSchema,
  commentStatusSchema,
  createCommentSchema,
  updateCommentBodySchema,
} from "./schema";
import * as service from "./service";

function invalid(error?: string) {
  return { ok: false as const, error: error ?? "Input tidak valid." };
}

export async function createCommentAction(input: unknown, articleSlug: string) {
  const parsed = createCommentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.create(parsed.data);
  if (result.ok) revalidatePath(`/articles/${articleSlug}`);
  return result;
}

export async function deleteCommentAction(
  commentId: string,
  articleSlug: string,
) {
  const user = await getCurrentUser();
  const result = await service.remove(user, commentId);
  if (result.ok) {
    revalidatePath(`/articles/${articleSlug}`);
    revalidatePath("/dashboard/comments");
  }
  return result;
}

export async function moderateCommentsAction(ids: unknown, status: unknown) {
  const user = await getCurrentUser();
  const parsedIds = commentIdsSchema.safeParse(ids);
  const parsedStatus = commentStatusSchema.safeParse(status);
  if (!parsedIds.success || !parsedStatus.success) return invalid();
  const result = await service.setStatus(
    user,
    parsedIds.data,
    parsedStatus.data,
  );
  if (result.ok) revalidatePath("/dashboard/comments");
  return result;
}

export async function deleteCommentsAction(ids: unknown) {
  const user = await getCurrentUser();
  const parsed = commentIdsSchema.safeParse(ids);
  if (!parsed.success) return invalid();
  const result = await service.removeMany(user, parsed.data);
  if (result.ok) revalidatePath("/dashboard/comments");
  return result;
}

export async function updateCommentBodyAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = updateCommentBodySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.updateBody(
    user,
    parsed.data.id,
    parsed.data.body,
  );
  if (result.ok) revalidatePath("/dashboard/comments");
  return result;
}
