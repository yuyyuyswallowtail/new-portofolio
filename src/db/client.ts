import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __portofolioClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env first.");
}

// Transaction pooler (Supabase 6543): koneksi klien murah karena backend
// dipakai bergantian, jadi max tinggi aman dan menghindari antrean panjang di
// driver (antrean panjang memicu query macet di pooler, lihat tes pooler).
// Session mode (5432) dibatasi pool_size, jadi di sana max harus kecil.
const isTransactionPooler = new URL(connectionString).port === "6543";
const maxConnections = process.env.VERCEL
  ? isTransactionPooler
    ? 20
    : 3
  : 10;

// Reuse the client across hot reloads in dev so we don't exhaust Postgres connections.
const client =
  globalThis.__portofolioClient ??
  postgres(connectionString, {
    // Aman untuk pooler transaction mode (6543) maupun session mode (5432).
    prepare: false,
    max: maxConnections,
    connect_timeout: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__portofolioClient = client;
}

export const db = drizzle(client, { schema });
