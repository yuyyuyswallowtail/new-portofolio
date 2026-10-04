import Link from "next/link";
import { Pagination } from "@/components/dashboard/pagination";
import { ArticleCover } from "@/components/site/article-cover";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { listForDashboard } from "@/modules/articles/service";
import { AutoGenerateButton } from "./auto-generate-button";
import { FilterBar } from "./filter-bar";
import { DeleteButton, PublishButton } from "./row-actions";

export default async function DashboardArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  const page = Number(sp.page ?? "1") || 1;
  const pageSize = 10;
  const { items, total } = await listForDashboard(user, {
    q: sp.q,
    tag: sp.tag,
    status: sp.status as "draft" | "published" | undefined,
    page,
    pageSize,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Articles</h1>
        <div className="flex flex-wrap gap-3">
          <AutoGenerateButton />
          <Link
            href="/dashboard/articles/new"
            className={buttonVariants({ variant: "outline" })}
          >
            Write manually
          </Link>
          <Link
            href="/dashboard/articles/new?ai=1"
            className={buttonVariants({ variant: "primary" })}
          >
            Generate with AI
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <FilterBar />
      </div>

      <div className="space-y-3">
        {items.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 border-b border-line pb-3"
          >
            <div className="flex min-w-0 items-center gap-4">
              <ArticleCover src={a.coverImageUrl} className="w-24 shrink-0" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{a.title}</p>
                  <Badge tone={a.status === "published" ? "accent" : "warn"}>
                    {a.status}
                  </Badge>
                  {a.aiGenerated && <Badge>ai</Badge>}
                </div>
                <p className="font-data text-xs text-ink-muted">
                  {a.slug} · {formatDate(a.createdAt)}
                  {a.tags.length > 0 && <> · {a.tags.join(", ")}</>}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/dashboard/articles/${a.id}/edit`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Edit
              </Link>
              {a.status === "draft" && <PublishButton id={a.id} />}
              <DeleteButton id={a.id} />
            </div>
          </div>
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
        basePath="/dashboard/articles"
        searchParams={sp}
      />
    </div>
  );
}
