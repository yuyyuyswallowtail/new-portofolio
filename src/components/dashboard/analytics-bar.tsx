import { Card } from "@/components/ui/card";
import type { DashboardAnalytics } from "@/modules/analytics/service";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "accent";
}) {
  return (
    <Card className="p-4">
      <p className="font-data text-xs text-ink-muted">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${tone === "accent" ? "text-accent" : ""}`}
      >
        {value}
      </p>
    </Card>
  );
}

/**
 * Required on every /dashboard/* page (see src/app/dashboard/layout.tsx) —
 * not just the home page. Cheap to render: the underlying query is cached
 * for 15s (see modules/analytics/service.ts).
 */
export function AnalyticsBar({ data }: { data: DashboardAnalytics }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
      <Stat label="articles" value={data.articles.total} />
      <Stat label="published" value={data.articles.published} tone="accent" />
      <Stat label="drafts" value={data.articles.draft} />
      <Stat label="ai-generated" value={data.articles.aiGenerated} />
      <Stat label="projects" value={data.content.projects} />
      <Stat label="certifications" value={data.content.certifications} />
      <Stat label="active sessions" value={data.staff.activeSessions} />
    </div>
  );
}
