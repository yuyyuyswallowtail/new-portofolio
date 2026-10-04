import Link from "next/link";
import { Pagination } from "@/components/dashboard/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import {
  listForModeration,
  moderationCounts,
} from "@/modules/comments/service";
import { CommentsManager } from "./manager";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "spam", label: "Spam" },
] as const;

export default async function DashboardCommentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  const status = TABS.find((t) => t.key === sp.status)?.key ?? "pending";
  const page = Number(sp.page ?? "1") || 1;
  const pageSize = 15;
  const q = sp.q?.trim() || undefined;

  const [data, counts] = await Promise.all([
    listForModeration(user, { status, q, page, pageSize }),
    moderationCounts(user),
  ]);
  if (!data || !counts) {
    return (
      <p className="text-sm text-ink-muted">
        Kamu tidak punya izin memoderasi komentar.
      </p>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold">Comments</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Komentar baru disaring otomatis. Spam jelas masuk tab Spam, sedangkan
        yang terindikasi SARA, kasar, atau meragukan ditahan di Pending sampai
        kamu putuskan.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-line">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/dashboard/comments?status=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                t.key === status
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {t.label} ({counts[t.key]})
            </Link>
          ))}
        </div>
        <form className="flex gap-2 pb-2" method="get">
          <input type="hidden" name="status" value={status} />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Cari nama, email, atau isi..."
            className="h-8 w-56"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      <CommentsManager items={data.items} />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={data.total}
        basePath="/dashboard/comments"
        searchParams={sp}
      />
    </div>
  );
}
