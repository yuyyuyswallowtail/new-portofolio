import "server-only";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { findUserByEmail } from "./repository";
import type { LoginInput } from "./schema";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function login(
  input: LoginInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  const user = await findUserByEmail(input.email);
  if (!user) return { ok: false, error: "Email atau password salah." };

  const valid = await verifyPassword(input.password, user.password, user.salt);
  if (!valid) return { ok: false, error: "Email atau password salah." };

  await createSession(user.id);

  const redirectTo = user.role === "viewer" ? "/" : "/dashboard";
  return { ok: true, data: { redirectTo } };
}

export async function logout(): Promise<ActionResult<null>> {
  await destroySession();
  return { ok: true, data: null };
}
