"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { changePasswordSchema, updateProfileSchema } from "./schema";
import * as service from "./service";

export async function updateProfileAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "Input tidak valid." };

  const result = await service.updateProfile(user, parsed.data);
  if (result.ok) {
    revalidatePath("/dashboard/profile");
    revalidatePath("/");
  }
  return result;
}

export async function changePasswordAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
    };
  }
  return service.changePassword(user, parsed.data);
}
