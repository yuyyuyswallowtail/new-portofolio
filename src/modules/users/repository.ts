import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";

export async function listAll() {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function findByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] ?? null;
}

export async function create(values: typeof users.$inferInsert) {
  const [row] = await db.insert(users).values(values).returning();
  if (!row) throw new Error("Failed to create user");
  return row;
}

export async function updateRole(
  userId: string,
  role: (typeof users.$inferSelect)["role"],
) {
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function setActive(userId: string, isActive: boolean) {
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}
