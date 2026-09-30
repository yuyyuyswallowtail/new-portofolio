import { sql } from "drizzle-orm";
import type { Role } from "@/lib/rbac";
import { db } from "./client";

/**
 * Runs `fn` inside a transaction with `app.current_user_id` / `app.current_role`
 * session variables set, so the RLS policies in policies.sql can see who's asking.
 * This is the "third layer" from ARCHITECTURE.md §4 — call it from services that
 * mutate data, not from the route/action layer directly.
 */
export async function withUserContext<T>(
  user: { id: string; role: Role } | null,
  fn: (tx: typeof db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    if (user) {
      await tx.execute(sql`SET LOCAL app.current_user_id = ${user.id}`);
      await tx.execute(sql`SET LOCAL app.current_role = ${user.role}`);
    } else {
      await tx.execute(sql`SET LOCAL app.current_user_id = ''`);
      await tx.execute(sql`SET LOCAL app.current_role = ''`);
    }
    return fn(tx as unknown as typeof db);
  });
}
