import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions } from "@/db/schema";
import { logger } from "@/lib/logger";
import { hashPassword } from "@/lib/password";
import { can, type Role } from "@/lib/rbac";
import * as repo from "./repository";
import type {
  CreateStaffInput,
  ToggleActiveInput,
  UpdateRoleInput,
} from "./schema";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
type CurrentUser = { id: string; role: Role } | null;

function assertSuperAdmin(
  user: CurrentUser,
): user is { id: string; role: Role } {
  return !!user && can(user.role, "users.manage");
}

export async function listAll(user: CurrentUser) {
  if (!assertSuperAdmin(user)) return [];
  return repo.listAll();
}

export async function createStaff(
  user: CurrentUser,
  input: CreateStaffInput,
): Promise<ActionResult<{ id: string }>> {
  if (!assertSuperAdmin(user)) {
    return {
      ok: false,
      error: "Hanya super_admin yang bisa membuat akun staff.",
    };
  }
  const existing = await repo.findByEmail(input.email);
  if (existing) return { ok: false, error: "Email sudah terdaftar." };

  const { hash, salt } = await hashPassword(input.password);
  const row = await repo.create({
    email: input.email,
    name: input.name,
    password: hash,
    salt,
    role: input.role,
  });
  logger.info("staff_created", {
    createdBy: user.id,
    newUserId: row.id,
    role: input.role,
  });
  return { ok: true, data: { id: row.id } };
}

export async function updateRole(
  user: CurrentUser,
  input: UpdateRoleInput,
): Promise<ActionResult<null>> {
  if (!assertSuperAdmin(user)) {
    return { ok: false, error: "Hanya super_admin yang bisa mengubah role." };
  }
  if (input.userId === user.id) {
    return { ok: false, error: "Tidak bisa mengubah role akun sendiri." };
  }
  await repo.updateRole(input.userId, input.role);
  logger.info("role_updated", {
    changedBy: user.id,
    targetUserId: input.userId,
    role: input.role,
  });
  return { ok: true, data: null };
}

export async function setActive(
  user: CurrentUser,
  input: ToggleActiveInput,
): Promise<ActionResult<null>> {
  if (!assertSuperAdmin(user)) {
    return {
      ok: false,
      error: "Hanya super_admin yang bisa menonaktifkan akun.",
    };
  }
  if (input.userId === user.id) {
    return { ok: false, error: "Tidak bisa menonaktifkan akun sendiri." };
  }
  await repo.setActive(input.userId, input.isActive);
  if (!input.isActive) {
    // Kill any live sessions immediately rather than waiting for expiry.
    await db.delete(sessions).where(eq(sessions.userId, input.userId));
  }
  logger.info("account_active_toggled", {
    changedBy: user.id,
    targetUserId: input.userId,
    isActive: input.isActive,
  });
  return { ok: true, data: null };
}
