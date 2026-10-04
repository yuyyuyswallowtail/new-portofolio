import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { sessions, users } from "@/db/schema";
import type { Role } from "@/lib/rbac";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "portofolio_session";
const TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
  const [row] = await db
    .insert(sessions)
    .values({ userId, expiresAt })
    .returning();
  if (!row) throw new Error("Failed to create session row");
  const store = await cookies();
  store.set(COOKIE_NAME, row.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
  return row;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const sessionId = store.get(COOKIE_NAME)?.value;
  // A malformed/stale/tampered cookie (not a valid UUID) means "not logged
  // in" — it must never surface as a 500 (this crashed every page before:
  // Postgres throws on `invalid input syntax for type uuid`).
  if (!sessionId || !UUID_RE.test(sessionId)) return null;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now() || !row.isActive) {
    await destroySession();
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as Role,
  };
}

export async function destroySession() {
  const store = await cookies();
  const sessionId = store.get(COOKIE_NAME)?.value;
  if (sessionId && UUID_RE.test(sessionId)) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  store.delete(COOKIE_NAME);
}
