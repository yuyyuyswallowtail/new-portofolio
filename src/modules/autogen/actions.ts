"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { INTERVAL_OPTIONS } from "./options";
import * as service from "./service";

const updateSchema = z.object({
  intervalMinutes: z
    .number()
    .int()
    .refine(
      (v) => INTERVAL_OPTIONS.some((o) => o.minutes === v),
      "Interval tidak valid.",
    )
    .optional(),
  autoPublish: z.boolean().optional(),
});

export async function getAutoGenerateStateAction() {
  return service.getState(await getCurrentUser());
}

export async function updateAutoGenerateAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
    };
  }
  return service.update(user, parsed.data);
}

export async function startAutoGenerateAction() {
  const user = await getCurrentUser();
  const result = await service.start(user);
  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/articles");
    revalidatePath("/articles");
    revalidatePath("/");
  }
  return result;
}

export async function stopAutoGenerateAction() {
  return service.stop(await getCurrentUser());
}
