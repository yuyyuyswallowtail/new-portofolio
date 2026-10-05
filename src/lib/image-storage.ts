import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const LOCAL_DIR = path.join(process.cwd(), "public", "uploads", "articles");

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return {
    base: url.replace(/\/$/, ""),
    key,
    bucket: process.env.SUPABASE_BUCKET ?? "uploads",
  };
}

/**
 * Simpan gambar artikel dan kembalikan URL-nya.
 * - Env Supabase terisi: upload ke Supabase Storage (wajib di Vercel, karena
 *   filesystem-nya read-only).
 * - Tanpa itu dan bukan di Vercel (dev lokal / Docker): tulis ke public/uploads.
 */
export async function saveArticleImage(
  buffer: Buffer,
  ext: string,
  contentType: string,
): Promise<string> {
  const filename = `${randomUUID()}.${ext}`;
  const cfg = supabaseConfig();

  if (cfg) {
    const objectPath = `articles/${filename}`;
    const res = await fetch(
      `${cfg.base}/storage/v1/object/${cfg.bucket}/${objectPath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.key}`,
          apikey: cfg.key,
          "Content-Type": contentType,
          "cache-control": "max-age=31536000",
        },
        body: new Uint8Array(buffer),
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Supabase Storage upload failed: ${res.status} ${body.slice(0, 200)}`,
      );
    }
    return `${cfg.base}/storage/v1/object/public/${cfg.bucket}/${objectPath}`;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Supabase Storage env not set (filesystem Vercel read-only): isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, filename), buffer);
  return `/uploads/articles/${filename}`;
}
