import { Pagination } from "@/components/dashboard/pagination";
import { ArticleCard } from "@/components/site/article-card";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
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
      <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <p className="kicker">/ Writing</p>
        <h1 className="display-lg mt-3">Articles</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-muted">
          Writing on AI, web development, and networking.
        </p>

        <div className="mt-10">
          <PublicFilterBar />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2">
          {items.map((a, i) => (
            <ArticleCard key={a.id} a={a} index={i} />
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
