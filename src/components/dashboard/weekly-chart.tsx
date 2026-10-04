import { cn } from "@/lib/utils";

export function WeeklyChart({
  data,
}: {
  data: { week: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const sum = data.reduce((acc, d) => acc + d.count, 0);

  return (
    <div
      className="flex items-end gap-2"
      role="img"
      aria-label={`Artikel dibuat per minggu, total ${sum} dalam ${data.length} minggu terakhir`}
    >
      {data.map((d) => (
        <div key={d.week} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-24 w-full items-end">
            <div
              className={cn(
                "w-full rounded-[3px]",
                d.count === 0 ? "bg-line" : "bg-accent",
              )}
              style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
              title={`Minggu ${d.week}: ${d.count} artikel`}
            />
          </div>
          <span className="font-data text-xs text-ink">{d.count}</span>
          <span className="font-data text-[10px] text-ink-muted">
            {d.week.slice(8, 10)}/{d.week.slice(5, 7)}
          </span>
        </div>
      ))}
    </div>
  );
}
