import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrasi lewat koneksi langsung (5432); runtime memakai pooler (6543).
    url: (process.env.DIRECT_URL ?? process.env.DATABASE_URL) as string,
  },
});
