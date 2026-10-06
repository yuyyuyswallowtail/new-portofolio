import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/site/article-body";
import { CommentsSection } from "@/components/site/comments-section";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { ShareBar } from "@/components/site/share-bar";
import { aiCredit } from "@/lib/ai-credit";
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
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <Link href="/articles" className="kicker hover:text-ink">
          ← All articles
        </Link>
        <div className="font-data mt-8 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span>{formatDate(article.publishedAt)}</span>
          {article.aiGenerated && <span className="chip">ai-generated</span>}
          {article.tags.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
          {article.title}
        </h1>
        {article.coverImageUrl && (
          // biome-ignore lint/performance/noImgElement: cover bisa berupa data: URL atau file upload, next/image tidak bisa mengoptimasi keduanya dengan andal di sini
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="mt-8 w-full rounded-[28px] border border-line object-cover"
          />
        )}
        <div className="mx-auto mt-10 max-w-[72ch]">
          <ArticleBody html={html} />
          {article.aiGenerated && (
            <p className="font-data mt-10 text-xs text-ink-muted">
              {aiCredit()}
            </p>
          )}
          <ShareBar title={article.title} slug={article.slug} />
          <CommentsSection
            articleId={article.id}
            articleSlug={article.slug}
            comments={comments}
            canModerate={isStaff(user?.role)}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
