import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { type Action, can } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

type FolderName = "articles" | "skills" | "education";
type FolderConfig = {
  permission: Action;
  maxBytes: number;
  types: Record<string, string>;
  localDir: string;
};

const FOLDERS: Record<FolderName, FolderConfig> = {
  articles: {
    permission: "articles.create",
    // Vercel menolak body request > 4,5MB, jadi batasnya 4MB.
    maxBytes: 4 * 1024 * 1024,
    types: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    },
    localDir: path.join(process.cwd(), "public", "uploads", "articles"),
  },
  skills: {
    // Logo skill: kecil (sudah diperkecil di browser), butuh transparansi.
    permission: "content.manage",
    maxBytes: 512 * 1024,
    types: { "image/png": "png", "image/webp": "webp" },
    localDir: path.join(process.cwd(), "public", "uploads", "skills"),
  },
  education: {
    // Gambar institusi: sudah diperkecil di browser (maks 640px).
    permission: "content.manage",
    maxBytes: 1024 * 1024,
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
    localDir: path.join(process.cwd(), "public", "uploads", "education"),
  },
};

function parseFolder(value: FormDataEntryValue | null): FolderName {
  return value === "skills" || value === "education" ? value : "articles";
}

function sizeLabel(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${bytes / 1024 / 1024}MB`
    : `${Math.round(bytes / 1024)}KB`;
}

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
  folder: FolderName,
  filename: string,
  contentType: string,
  buffer: Buffer,
): Promise<string | null> {
  const objectPath = `${folder}/${filename}`;
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
 * Upload gambar. Field `folder` opsional: "articles" (default, Tiptap + cover
 * artikel), "skills" (logo skill, maks 512KB) atau "education" (gambar
 * institusi, maks 1MB); dua terakhir butuh izin content.manage.
 * Dengan env Supabase terisi, file disimpan di Supabase Storage (wajib di
 * Vercel). Tanpa itu, jatuh ke disk lokal (Docker Compose, volume
 * `uploads_data`). Auth dan validasi ukuran/MIME tetap di server
 * (SECURITY.md §3).
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
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

  const folder = parseFolder(formData.get("folder"));
  const cfg = FOLDERS[folder];
  if (!can(user.role, cfg.permission)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  const ext = cfg.types[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "unsupported file type" },
      { status: 400 },
    );
  }
  if (file.size > cfg.maxBytes) {
    return NextResponse.json(
      { error: `file too large (max ${sizeLabel(cfg.maxBytes)})` },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${ext}`;

  let url: string | null;
  const storage = supabaseConfig();
  if (storage) {
    url = await saveToSupabase(storage, folder, filename, file.type, buffer);
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
    await mkdir(cfg.localDir, { recursive: true });
    await writeFile(path.join(cfg.localDir, filename), buffer);
    url = `/uploads/${folder}/${filename}`;
  }

  logger.info("upload_success", {
    userId: user.id,
    folder,
    url,
    size: file.size,
  });
  return NextResponse.json({ url });
}
