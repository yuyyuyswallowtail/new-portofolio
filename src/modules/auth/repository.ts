import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function findUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] ?? null;
}
