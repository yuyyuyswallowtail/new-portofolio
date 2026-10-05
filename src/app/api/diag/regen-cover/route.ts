import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { generateArticleImages } from "@/lib/article-images";

/** SEMENTARA: buat ulang cover satu artikel. Hapus setelah selesai. */
export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug kosong" }, { status: 400 });

  const [row] = await db.select().from(articles).where(eq(articles.slug, slug));
  if (!row) return NextResponse.json({ error: "artikel tidak ada" }, { status: 404 });

  // "## " diubah ke "### " supaya gambar section tidak ikut dibuat (hanya cover).
  const input = {
    ...row,
    excerpt: row.excerpt ?? "",
    tags: row.tags ?? [],
    contentMd: (row.contentMd ?? "").replace(/^##\s+/gm, "### "),
  } as Parameters<typeof generateArticleImages>[0];

  const res = await generateArticleImages(input, { budgetMs: 80_000 });
  const ok = res.coverImageUrl.startsWith("http");
  if (ok) {
    await db
      .update(articles)
      .set({ coverImageUrl: res.coverImageUrl })
      .where(eq(articles.slug, slug));
  }
  return NextResponse.json({ slug, updated: ok, cover: res.coverImageUrl.slice(0, 120) });
}
