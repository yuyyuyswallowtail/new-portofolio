import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { can } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
// Vercel menolak body request > 4,5MB, jadi batasnya 4MB.
const MAX_BYTES = 4 * 1024 * 1024;

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

async function saveToSupabase(
  cfg: NonNullable<ReturnType<typeof supabaseConfig>>,
  filename: string,
  contentType: string,
  buffer: Buffer,
): Promise<string | null> {
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
    },
  );
  if (!res.ok) {
    logger.error("upload_supabase_failed", {
      status: res.status,
      body: await res.text().catch(() => ""),
    });
    return null;
  }
  return `${cfg.base}/storage/v1/object/public/${cfg.bucket}/${objectPath}`;
}

/**
 * Upload gambar (Tiptap + cover artikel). Dengan env Supabase terisi, file
 * disimpan di Supabase Storage (wajib di Vercel). Tanpa itu, jatuh ke disk
 * lokal (Docker Compose, volume `uploads_data`). Auth dan validasi
 * ukuran/MIME tetap di server (SECURITY.md §3).
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "articles.create")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const limit = rateLimit(`upload:${user.id}`, {
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "expected multipart/form-data" },
      { status: 400 },
    );
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "unsupported file type" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "file too large (max 4MB)" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${ext}`;

  let url: string | null;
  const cfg = supabaseConfig();
  if (cfg) {
    url = await saveToSupabase(cfg, filename, file.type, buffer);
    if (!url) {
      return NextResponse.json({ error: "storage_failed" }, { status: 502 });
    }
  } else if (process.env.VERCEL) {
    logger.error("upload_misconfigured", { reason: "Supabase env not set" });
    return NextResponse.json(
      { error: "storage_not_configured" },
      { status: 500 },
    );
  } else {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_DIR, filename), buffer);
    url = `/uploads/articles/${filename}`;
  }

  logger.info("upload_success", { userId: user.id, url, size: file.size });
  return NextResponse.json({ url });
}
