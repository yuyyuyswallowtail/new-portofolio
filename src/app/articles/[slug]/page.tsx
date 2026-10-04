import { notFound } from "next/navigation";
import { CommentsSection } from "@/components/site/comments-section";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Badge } from "@/components/ui/badge";
import { sanitizeArticleHtml } from "@/lib/markdown";
import { isStaff } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { getBySlug } from "@/modules/articles/service";
import { listForArticle } from "@/modules/comments/service";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getBySlug(slug);
  if (article?.status !== "published") notFound();

  const html = sanitizeArticleHtml(article.contentMd);
  const [comments, user] = await Promise.all([
    listForArticle(article.id),
    getCurrentUser(),
  ]);

  return (
    <>
      <SiteNav />
      <main className="mx-auto w-full max-w-[72ch] px-4 py-10 sm:px-6 sm:py-16">
        <div className="font-data flex flex-wrap items-center gap-2 text-xs text-ink-muted sm:gap-3">
          <span>{formatDate(article.publishedAt)}</span>
          {article.aiGenerated && <Badge tone="accent">ai-generated</Badge>}
          {article.tags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
        <h1 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl">
          {article.title}
        </h1>
        {article.coverImageUrl && (
          // biome-ignore lint/performance/noImgElement: cover image may be a data: URL (Gemini output) or an uploaded file, next/image can't optimize either reliably here
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="mt-6 w-full rounded-[6px] border border-line object-cover"
          />
        )}
        <div
          className="prose prose-invert mt-8 w-full max-w-none break-words"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: html is DOMPurify-sanitized via sanitizeArticleHtml(), see SECURITY.md §3
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <CommentsSection
          articleId={article.id}
          articleSlug={article.slug}
          comments={comments}
          canModerate={isStaff(user?.role)}
        />
      </main>
      <SiteFooter />
    </>
  );
}
