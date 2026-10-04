import Link from "next/link";
import type { ReactNode } from "react";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAiModelInfo } from "@/lib/ai-models";
import { isStaff } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";
import { cn, formatDate } from "@/lib/utils";
import {
  getContentChecklist,
  getLastAiArticleAt,
  getWeeklyArticleActivity,
} from "@/modules/analytics/overview";
import { listAllForDashboard } from "@/modules/articles/repository";
import {
  listForModeration,
  moderationCounts,
} from "@/modules/comments/service";

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="hover:border-line">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

const linkClass = "font-data text-xs text-accent hover:underline";

export default async function DashboardHome() {
  const user = await getCurrentUser();
  const staff = isStaff(user?.role);

  const [recentArticles, weekly, lastAi, checklist, comments, counts] =
    await Promise.all([
      listAllForDashboard({ limit: 5, offset: 0 }),
      staff ? getWeeklyArticleActivity() : Promise.resolve([]),
      staff ? getLastAiArticleAt() : Promise.resolve(null),
      staff ? getContentChecklist() : Promise.resolve([]),
      listForModeration(user, { page: 1, pageSize: 5 }),
      moderationCounts(user),
    ]);

  const pending = counts?.pending ?? 0;
  const doneCount = checklist.filter((c) => c.done).length;
  const todo = checklist.filter((c) => !c.done);
  const ai = getAiModelInfo();
  const cronHours = process.env.CRON_SCHEDULE_HOURS;
  const autoPublish = process.env.CRON_AUTO_PUBLISH === "true";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome, {user?.name ?? user?.email}
        </h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard/articles/new?ai=1"
            className={buttonVariants({ variant: "primary" })}
          >
            Generate with AI
          </Link>
          <Link
            href="/dashboard/articles/new"
            className={buttonVariants({ variant: "outline" })}
          >
            Write article
          </Link>
          {staff && (
            <>
              <Link
                href="/dashboard/projects"
                className={buttonVariants({ variant: "outline" })}
              >
                Add project
              </Link>
              <Link
                href="/dashboard/comments"
                className={buttonVariants({ variant: "outline" })}
              >
                Moderate comments{pending > 0 ? ` (${pending})` : ""}
              </Link>
            </>
          )}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "ghost" })}
          >
            View site ↗
          </a>
        </div>
      </div>

      {staff && checklist.length > 0 && (
        <Panel
          title="Perlu perhatian"
          action={
            <span className="font-data text-xs text-ink-muted">
              {doneCount}/{checklist.length} lengkap
            </span>
          }
        >
          {todo.length === 0 ? (
            <p className="text-sm text-accent">
              Semua konten portfolio sudah lengkap.
            </p>
          ) : (
            <ul className="space-y-2">
              {todo.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-[6px] border border-line px-3 py-2 text-sm hover:border-accent"
                  >
                    <span>
                      {item.label}
                      {item.hint && (
                        <span className="font-data ml-2 text-xs text-warn">
                          {item.hint}
                        </span>
                      )}
                    </span>
                    <span className="font-data text-xs text-accent">
                      lengkapi →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Artikel terbaru"
          action={
            <Link href="/dashboard/articles" className={linkClass}>
              semua →
            </Link>
          }
        >
          <ul className="space-y-3">
            {recentArticles.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/articles/${a.id}/edit`}
                    className="line-clamp-1 text-sm font-medium hover:text-accent"
                  >
                    {a.title}
                  </Link>
                  <p className="font-data text-xs text-ink-muted">
                    {formatDate(a.createdAt)}
                    {a.aiGenerated ? " · ai" : ""}
                  </p>
                </div>
                <Badge tone={a.status === "published" ? "accent" : "warn"}>
                  {a.status}
                </Badge>
              </li>
            ))}
            {recentArticles.length === 0 && (
              <p className="text-sm text-ink-muted">Belum ada artikel.</p>
            )}
          </ul>
        </Panel>

        {comments && counts ? (
          <Panel
            title="Komentar terbaru"
            action={
              <Link href="/dashboard/comments" className={linkClass}>
                moderasi →
              </Link>
            }
          >
            <div className="font-data mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {(["pending", "approved", "rejected", "spam"] as const).map(
                (s) => (
                  <Link
                    key={s}
                    href={`/dashboard/comments?status=${s}`}
                    className={cn(
                      "hover:underline",
                      s === "pending" && counts.pending > 0
                        ? "text-warn"
                        : "text-ink-muted",
                    )}
                  >
                    {s} {counts[s]}
                  </Link>
                ),
              )}
            </div>
            <ul className="space-y-3">
              {comments.items.map((c) => (
                <li key={c.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.authorName}</span>
                    <Badge
                      tone={
                        c.status === "approved"
                          ? "accent"
                          : c.status === "pending"
                            ? "warn"
                            : "default"
                      }
                    >
                      {c.status}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm text-ink-muted">
                    {c.body}
                  </p>
                  <p className="font-data text-xs text-ink-muted">
                    {c.articleTitle} · {formatDate(c.createdAt)}
                  </p>
                </li>
              ))}
              {comments.items.length === 0 && (
                <p className="text-sm text-ink-muted">Belum ada komentar.</p>
              )}
            </ul>
          </Panel>
        ) : null}
      </div>

      {staff && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title="Artikel per minggu">
            <WeeklyChart data={weekly} />
            <p className="font-data mt-3 text-xs text-ink-muted">
              8 minggu terakhir, termasuk draft (tanggal = awal minggu)
            </p>
          </Panel>

          <Panel title="Auto-generate">
            <dl className="font-data space-y-2 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">model teks</dt>
                <dd>{ai.textModel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">gambar</dt>
                <dd>{ai.imageModel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">artikel AI terakhir</dt>
                <dd>{lastAi ? formatDate(lastAi) : "belum ada"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">jadwal cron</dt>
                <dd>
                  {cronHours ? `tiap ${cronHours} jam` : "tidak terdeteksi"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">publish otomatis</dt>
                <dd>
                  {cronHours ? (autoPublish ? "ya" : "tidak (draft)") : "-"}
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      )}
    </div>
  );
}
