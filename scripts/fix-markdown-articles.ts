import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import { articles } from "../src/db/schema";
import { markdownToHtml } from "../src/lib/markdown";

// HTML hasil converter selalu diawali tag blok. Kalau tidak, dan ada sintaks
// Markdown di awal baris (heading / code fence), anggap masih Markdown mentah.
function looksLikeMarkdown(content: string): boolean {
  const trimmed = content.trim();
  if (/^<(p|h[1-6]|ul|ol|pre|blockquote)[\s>]/i.test(trimmed)) return false;
  return /^#{1,6}\s+\S/m.test(trimmed) || /^```/m.test(trimmed);
}

async function main() {
  const rows = await db.select().from(articles);
  let fixed = 0;

  for (const row of rows) {
    if (!looksLikeMarkdown(row.contentMd)) continue;

    const html = markdownToHtml(row.contentMd);
    await db.update(articles).set({ contentMd: html }).where(eq(articles.id, row.id));
    fixed++;
    console.log(`fixed: ${row.slug}`);
  }

  console.log(`Done. ${fixed} article(s) converted, ${rows.length - fixed} skipped.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
