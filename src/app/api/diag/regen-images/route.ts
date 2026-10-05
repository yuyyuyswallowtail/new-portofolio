import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { articles } from "@/db/schema";
import { generateArticleImages } from "@/lib/article-images";

/** SEMENTARA: buat ulang cover + gambar section (konten HTML), kembalikan log. Hapus setelah selesai. */
export const runtime = "nodejs";
export const maxDuration = 300;

const strip = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id kosong" }, { status: 400 });

  const [row] = await db.select().from(articles).where(eq(articles.id, id));
  if (!row) return NextResponse.json({ error: "artikel tidak ada" }, { status: 404 });

  const html = (row.contentMd ?? "").replace(
    /<p>\s*<img[^>]*\/uploads\/articles\/[^>]*>\s*<\/p>\s*/g,
    "",
  );

  let md = "";
  for (const t of html.split(/(<h2[^>]*>[\s\S]*?<\/h2>)/)) {
    md += /^<h2/.test(t) ? `\n\n## ${strip(t)}\n\n` : `${strip(t)} `;
  }

  const input = {
    ...row,
    excerpt: row.excerpt ?? "",
    tags: row.tags ?? [],
    contentMd: md,
  } as Parameters<typeof generateArticleImages>[0];

  const lines: string[] = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  const grab = (a: unknown[]) => {
    const s = a.map(String).join(" ");
    if (/article_|pollinations|visual_prompt/.test(s)) lines.push(s.slice(0, 400));
  };
  console.log = (...a: unknown[]) => {
    grab(a);
    orig.log(...a);
  };
  console.warn = (...a: unknown[]) => {
    grab(a);
    orig.warn(...a);
  };
  console.error = (...a: unknown[]) => {
    grab(a);
    orig.error(...a);
  };

  const t0 = Date.now();
  let res: Awaited<ReturnType<typeof generateArticleImages>>;
  try {
    res = await generateArticleImages(input, { budgetMs: 240_000 });
  } finally {
    console.log = orig.log;
    console.warn = orig.warn;
    console.error = orig.error;
  }

  const urls = new Map<string, string>();
  for (const m of res.contentMd.matchAll(/^##\s+(.+)\n\s*!\[[^\]]*\]\(([^)]+)\)/gm)) {
    const h = m[1];
    const u = m[2];
    if (h && u) urls.set(h.trim(), u);
  }
  const finalHtml = html.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, (full, inner: string) => {
    const u = urls.get(strip(inner));
    if (!u) return full;
    const alt = strip(inner).replace(/"/g, "&quot;");
    return `${full}\n<p><img src="${u}" alt="${alt}"></p>`;
  });

  const coverOk = res.coverImageUrl.startsWith("http");
  await db
    .update(articles)
    .set({
      ...(urls.size > 0 ? { contentMd: finalHtml } : {}),
      ...(coverOk ? { coverImageUrl: res.coverImageUrl } : {}),
    })
    .where(eq(articles.id, id));
  return NextResponse.json({ id, coverOk, sectionImages: urls.size, ms: Date.now() - t0, logs: lines });
}
