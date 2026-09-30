import { randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

/**
 * Matches the existing `users.password` + `users.salt` column pair (see
 * SECURITY.md §1 — deliberately two columns, not a combined hash string).
 * If you already have a lib/password.ts in the real project with a different
 * signature, keep that one — this is provided so auth/service.ts has something
 * to call out of the box.
 */
export async function hashPassword(
  plain: string,
): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString("hex");
  const hashed = await hash(plain + salt);
  return { hash: hashed, salt };
}

export async function verifyPassword(
  plain: string,
  hash_: string,
  salt: string,
): Promise<boolean> {
  return verify(hash_, plain + salt);
}
