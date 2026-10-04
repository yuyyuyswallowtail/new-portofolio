/**
 * Minimal structured logger — writes one JSON line per event to stdout/stderr,
 * which `docker compose logs` already captures. No external dependency: this
 * is a single-instance Docker deploy (see SECURITY.md), so a log aggregator
 * is out of scope — but every line being valid JSON means `docker compose
 * logs app | jq` works if you ever pipe it somewhere.
 */
type Level = "info" | "warn" | "error";

function write(level: Level, event: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...meta,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) =>
    write("info", event, meta),
  warn: (event: string, meta?: Record<string, unknown>) =>
    write("warn", event, meta),
  error: (event: string, meta?: Record<string, unknown>) =>
    write("error", event, meta),
};
