import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { listPublic } from "@/modules/articles/service";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await listPublic();

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Articles</h1>
        <p className="mt-2 text-ink-muted">
          Writing on AI, web development, and networking.
        </p>

        <div className="mt-10 space-y-8">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/articles/${a.slug}`}
              className="block border-b border-line pb-8 hover:border-accent"
            >
              <div className="flex items-center gap-3 font-data text-xs text-ink-muted">
                <span>{formatDate(a.publishedAt)}</span>
                {a.aiGenerated && <Badge tone="accent">ai-generated</Badge>}
                {a.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
              <h2 className="mt-2 text-xl font-medium">{a.title}</h2>
              <p className="mt-1 text-ink-muted">{a.excerpt}</p>
            </Link>
          ))}
          {articles.length === 0 && (
            <p className="text-sm text-ink-muted">
              Belum ada artikel published.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
