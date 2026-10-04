import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { invalidateCachePrefix } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { Role } from "@/lib/rbac";
import type { ChangePasswordInput, UpdateProfileInput } from "./schema";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
type CurrentUser = { id: string; role: Role } | null;

export async function updateProfile(
  user: CurrentUser,
  input: UpdateProfileInput,
): Promise<ActionResult<null>> {
  if (!user) return { ok: false, error: "Tidak terautentikasi." };

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  if (existing[0] && existing[0].id !== user.id) {
    return { ok: false, error: "Email sudah dipakai akun lain." };
  }

  await db
    .update(users)
    .set({
      email: input.email,
      name: input.name,
      bio: input.bio,
      phone: input.phone,
      domicile: input.domicile,
      linkedinUrl: input.linkedinUrl || null,
      githubUsername: input.githubUsername,
    })
    .where(eq(users.id, user.id));

  invalidateCachePrefix("dashboard:analytics");
  logger.info("profile_updated", { userId: user.id });
  return { ok: true, data: null };
}

export async function changePassword(
  user: CurrentUser,
  input: ChangePasswordInput,
): Promise<ActionResult<null>> {
  if (!user) return { ok: false, error: "Tidak terautentikasi." };

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  if (!row) return { ok: false, error: "User tidak ditemukan." };

  const valid = await verifyPassword(
    input.currentPassword,
    row.password,
    row.salt,
  );
  if (!valid) return { ok: false, error: "Password saat ini salah." };

  const { hash, salt } = await hashPassword(input.newPassword);
  await db
    .update(users)
    .set({ password: hash, salt })
    .where(eq(users.id, user.id));

  logger.info("password_changed", { userId: user.id });
  return { ok: true, data: null };
}
