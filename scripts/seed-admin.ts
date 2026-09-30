import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/password";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.");
    process.exit(1);
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing[0]) {
    console.log(
      `User ${email} already exists (role=${existing[0].role}). Nothing to do.`,
    );
    process.exit(0);
  }

  const { hash, salt } = await hashPassword(password);
  await db.insert(users).values({
    email,
    name,
    password: hash,
    salt,
    role: "super_admin",
  });

  console.log(`Created super_admin ${email}. You can log in at /login now.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
