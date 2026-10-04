"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import {
  createStaffSchema,
  toggleActiveSchema,
  updateRoleSchema,
} from "./schema";
import * as service from "./service";

export async function createStaffAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = createStaffSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
    };
  }
  const result = await service.createStaff(user, parsed.data);
  if (result.ok) revalidatePath("/dashboard/users");
  return result;
}

export async function updateRoleAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "Input tidak valid." };
  const result = await service.updateRole(user, parsed.data);
  if (result.ok) revalidatePath("/dashboard/users");
  return result;
}

export async function setActiveAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = toggleActiveSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "Input tidak valid." };
  const result = await service.setActive(user, parsed.data);
  if (result.ok) revalidatePath("/dashboard/users");
  return result;
}
