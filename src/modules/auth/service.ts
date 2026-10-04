import "server-only";
import { logger } from "@/lib/logger";
import { verifyPassword } from "@/lib/password";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { createSession, destroySession } from "@/lib/session";
import { findUserByEmail } from "./repository";
import type { LoginInput } from "./schema";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function login(
  input: LoginInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  const ip = await getClientIp();

  // Two independent windows: a tight one per email (stop targeted brute
  // force on one account) and a looser one per IP (stop spraying many
  // emails from one source) — see SECURITY.md §1.
  const byEmail = rateLimit(`login:email:${input.email.toLowerCase()}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  const byIp = rateLimit(`login:ip:${ip}`, {
    limit: 20,
    windowMs: 15 * 60 * 1000,
  });

  if (!byEmail.ok || !byIp.ok) {
    logger.warn("login_rate_limited", { email: input.email, ip });
    return {
      ok: false,
      error: "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.",
    };
  }

  const user = await findUserByEmail(input.email);
  if (!user) {
    logger.warn("login_failed_no_user", { email: input.email, ip });
    return { ok: false, error: "Email atau password salah." };
  }

  const valid = await verifyPassword(input.password, user.password, user.salt);
  if (!valid) {
    logger.warn("login_failed_bad_password", { email: input.email, ip });
    return { ok: false, error: "Email atau password salah." };
  }

  if (!user.isActive) {
    logger.warn("login_failed_inactive", { userId: user.id, ip });
    return { ok: false, error: "Akun ini sudah dinonaktifkan." };
  }

  await createSession(user.id);
  logger.info("login_success", { userId: user.id, ip });

  const redirectTo = user.role === "viewer" ? "/" : "/dashboard";
  return { ok: true, data: { redirectTo } };
}

export async function logout(): Promise<ActionResult<null>> {
  await destroySession();
  return { ok: true, data: null };
}
