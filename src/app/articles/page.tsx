import Link from "next/link";
import { Pagination } from "@/components/dashboard/pagination";
import { ArticleCover } from "@/components/site/article-cover";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { listPublic } from "@/modules/articles/service";
import { PublicFilterBar } from "./filter-bar";

export const dynamic = "force-dynamic";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const pageSize = 8;
  const { items, total } = await listPublic({
    q: sp.q,
    tag: sp.tag,
    page,
    pageSize,
  });

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Articles</h1>
        <p className="mt-2 text-ink-muted">
          Writing on AI, web development, and networking.
        </p>

        <div className="mt-10">
          <PublicFilterBar />
        </div>

        <div className="space-y-8">
          {items.map((a) => (
            <Link
              key={a.id}
              href={`/articles/${a.slug}`}
              className="flex flex-col gap-4 border-b border-line pb-8 hover:border-accent sm:flex-row sm:items-start sm:gap-6"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3 font-data text-xs text-ink-muted">
                  <span>{formatDate(a.publishedAt)}</span>
                  {a.aiGenerated && <Badge tone="accent">ai-generated</Badge>}
                  {a.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                <h2 className="mt-2 text-xl font-medium">{a.title}</h2>
                <p className="mt-1 text-ink-muted">{a.excerpt}</p>
              </div>
              <ArticleCover
                src={a.coverImageUrl}
                className="order-first w-full sm:order-none sm:w-56 sm:shrink-0"
              />
            </Link>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-ink-muted">
              Tidak ada artikel yang cocok.
            </p>
          )}
        </div>

        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath="/articles"
          searchParams={sp}
        />
      </main>
      <SiteFooter />
    </>
  );
}
