import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { listForDashboard } from "@/modules/articles/service";
import { DeleteButton, PublishButton } from "./row-actions";

export default async function DashboardArticlesPage() {
  const user = await getCurrentUser();
  const articles = await listForDashboard(user);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Articles</h1>
        <div className="flex gap-3">
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

      <div className="mt-8 space-y-3">
        {articles.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between border-b border-line pb-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{a.title}</p>
                <Badge tone={a.status === "published" ? "accent" : "warn"}>
                  {a.status}
                </Badge>
                {a.aiGenerated && <Badge>ai</Badge>}
              </div>
              <p className="font-data text-xs text-ink-muted">
                {a.slug} · {formatDate(a.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              {a.status === "draft" && <PublishButton id={a.id} />}
              <DeleteButton id={a.id} />
            </div>
          </div>
        ))}
        {articles.length === 0 && (
          <p className="text-sm text-ink-muted">Belum ada artikel.</p>
        )}
      </div>
    </div>
  );
}
