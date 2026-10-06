type Level = 0 | 1 | 2 | 3 | 4;
type Day = { date: string; count: number; level: Level };

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const LEFT = 30;
const TOP = 18;
// Warna aktivitas. Ganti ke warna lain (mis. kuning) kalau mau.
const ACCENT = "var(--accent)";
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_LABELS: [number, string][] = [
  [1, "Mon"],
  [3, "Wed"],
  [5, "Fri"],
];

async function getContributions(username: string): Promise<Day[] | null> {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { contributions?: Day[] };
    return data.contributions?.length ? data.contributions : null;
  } catch {
    return null;
  }
}

function fillFor(level: Level): string {
  if (level === 0) return "var(--line)";
  const pct = [0, 30, 50, 75, 100][level] ?? 100;
  return `color-mix(in srgb, ${ACCENT} ${pct}%, var(--line))`;
}

function fmt(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function GithubActivity({ username }: { username: string }) {
  const days = await getContributions(username);
  if (!days) return null;

  const total = days.reduce((n, d) => n + d.count, 0);
  const offset = new Date(`${days[0]?.date}T00:00:00Z`).getUTCDay();
  const weeks = Math.ceil((days.length + offset) / 7);
  const width = LEFT + weeks * STEP - GAP;
  const height = TOP + 7 * STEP - GAP;

  const monthLabels: { x: number; text: string }[] = [];
  let lastMonth = -1;
  let lastCol = -10;
  for (let c = 0; c < weeks; c++) {
    const d = days[Math.max(c * 7 - offset, 0)];
    if (!d) continue;
    const m = new Date(`${d.date}T00:00:00Z`).getUTCMonth();
    if (m !== lastMonth && c - lastCol >= 3) {
      monthLabels.push({ x: LEFT + c * STEP, text: MONTHS[m] ?? "" });
      lastMonth = m;
      lastCol = c;
    }
  }

  const muted = { fill: "var(--ink-muted)" };

  return (
    <div className="mt-4 rounded-[28px] border border-line bg-surface p-6 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-data text-xs uppercase tracking-widest text-ink-muted">
            GitHub activity
          </span>
          <p className="mt-2 text-xl font-semibold tracking-tight md:text-2xl">
            {total.toLocaleString("en")} contributions in the last year
          </p>
        </div>
        <a
          href={`https://github.com/${username}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:border-ink hover:text-ink"
        >
          @{username} ↗
        </a>
      </div>

      {/* direction:rtl di pembungkus membuat scroll di HP mulai dari sisi terbaru */}
      <div className="mt-5 overflow-x-auto [direction:rtl]">
        <div className="min-w-[720px] [direction:ltr]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            className="font-data block h-auto w-full"
            role="img"
            aria-label={`${total} GitHub contributions in the last year`}
          >
            {monthLabels.map((m) => (
              <text key={`${m.text}-${m.x}`} x={m.x} y={10} fontSize={10} style={muted}>
                {m.text}
              </text>
            ))}
            {DAY_LABELS.map(([row, label]) => (
              <text key={label} x={0} y={TOP + row * STEP + 9} fontSize={10} style={muted}>
                {label}
              </text>
            ))}
            {days.map((d, i) => {
              const col = Math.floor((i + offset) / 7);
              const row = (i + offset) % 7;
              return (
                <rect
                  key={d.date}
                  x={LEFT + col * STEP}
                  y={TOP + row * STEP}
                  width={CELL}
                  height={CELL}
                  rx={2.5}
                  style={{ fill: fillFor(d.level) }}
                >
                  <title>{`${d.count} contribution${d.count === 1 ? "" : "s"} on ${fmt(d.date)}`}</title>
                </rect>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="font-data mt-3 flex items-center justify-end gap-1.5 text-xs text-ink-muted">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as Level[]).map((l) => (
          <span
            key={l}
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ background: fillFor(l) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
