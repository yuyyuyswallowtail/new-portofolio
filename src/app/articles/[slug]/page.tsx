import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Badge } from "@/components/ui/badge";
import { renderArticleHtml } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { getBySlug } from "@/modules/articles/service";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getBySlug(slug);
  if (article?.status !== "published") notFound();

  const html = renderArticleHtml(article.contentMd);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-[72ch] px-6 py-16">
        <div className="font-data flex items-center gap-3 text-xs text-ink-muted">
          <span>{formatDate(article.publishedAt)}</span>
          {article.aiGenerated && <Badge tone="accent">ai-generated</Badge>}
        </div>
        <h1 className="mt-2 text-3xl font-semibold">{article.title}</h1>
        {article.coverImageUrl && (
          // biome-ignore lint/performance/noImgElement: cover image is a data: URL (Gemini output), next/image can't optimize those
          <img
            src={article.coverImageUrl}
            alt=""
            className="mt-6 w-full rounded-[6px] border border-line"
          />
        )}
        <div
          className="prose prose-invert mt-8 max-w-none leading-relaxed"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: html is DOMPurify-sanitized in renderArticleHtml(), see SECURITY.md §3
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
