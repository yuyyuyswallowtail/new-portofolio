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
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "articles");

/**
 * Local filesystem upload (see docker-compose.yml — `uploads_data` volume
 * keeps this across container rebuilds). Used by the Tiptap editor's image
 * button and the article cover/thumbnail field. Auth + size/MIME validation
 * happen server-side (SECURITY.md §3) — the <input accept> attribute on the
 * client is a UX hint only, never trusted.
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
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
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
      { error: "file too large (max 5MB)" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  const url = `/uploads/articles/${filename}`;
  logger.info("upload_success", { userId: user.id, url, size: file.size });
  return NextResponse.json({ url });
}
