import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { generateArticleImages } from "@/lib/article-images";

/** SEMENTARA: buat ulang cover + gambar section satu artikel. Hapus setelah selesai. */
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id kosong" }, { status: 400 });

  const [row] = await db.select().from(articles).where(eq(articles.id, id));
  if (!row) return NextResponse.json({ error: "artikel tidak ada" }, { status: 404 });

  const cleaned = (row.contentMd ?? "").replace(
    /^!\[[^\]]*\]\(https?:\/\/[^)]*\/uploads\/articles\/[^)]*\)\s*$/gm,
    "",
  );
  const input = {
    ...row,
    excerpt: row.excerpt ?? "",
    tags: row.tags ?? [],
    contentMd: cleaned,
  } as Parameters<typeof generateArticleImages>[0];

  const res = await generateArticleImages(input, { budgetMs: 240_000 });
  const coverOk = res.coverImageUrl.startsWith("http");
  const sections = (res.contentMd.match(/\/uploads\/articles\//g) ?? []).length;
  await db
    .update(articles)
    .set({
      contentMd: res.contentMd,
      ...(coverOk ? { coverImageUrl: res.coverImageUrl } : {}),
    })
    .where(eq(articles.id, id));
  return NextResponse.json({ id, coverOk, sectionImages: sections });
}
