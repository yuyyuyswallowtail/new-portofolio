import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/session";

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default async function SystemPage() {
  const user = await getCurrentUser();
  if (user?.role !== "super_admin") redirect("/dashboard");

  let dbOk = true;
  let dbLatencyMs = 0;
  try {
    const start = Date.now();
    await db.execute(sql`select 1`);
    dbLatencyMs = Date.now() - start;
  } catch {
    dbOk = false;
  }

  const mem = process.memoryUsage();

  return (
    <div>
      <h1 className="text-2xl font-semibold">System</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Status runtime server ini. Semua angka diambil langsung dari process
        Node.js dan koneksi database saat halaman ini di-render — bukan data
        statis.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <p className="font-data text-xs text-ink-muted">database</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={dbOk ? "accent" : "warn"}>
              {dbOk ? "connected" : "unreachable"}
            </Badge>
            {dbOk && (
              <span className="font-data text-xs text-ink-muted">
                {dbLatencyMs}ms
              </span>
            )}
          </div>
        </Card>
        <Card>
          <p className="font-data text-xs text-ink-muted">environment</p>
          <p className="mt-2 text-lg">{process.env.NODE_ENV}</p>
        </Card>
        <Card>
          <p className="font-data text-xs text-ink-muted">node.js</p>
          <p className="mt-2 text-lg">{process.version}</p>
        </Card>
        <Card>
          <p className="font-data text-xs text-ink-muted">process uptime</p>
          <p className="mt-2 text-lg">{formatUptime(process.uptime())}</p>
        </Card>
        <Card>
          <p className="font-data text-xs text-ink-muted">memory (RSS)</p>
          <p className="mt-2 text-lg">{formatBytes(mem.rss)}</p>
        </Card>
        <Card>
          <p className="font-data text-xs text-ink-muted">heap used / total</p>
          <p className="mt-2 text-lg">
            {formatBytes(mem.heapUsed)} / {formatBytes(mem.heapTotal)}
          </p>
        </Card>
        <Card>
          <p className="font-data text-xs text-ink-muted">cron auto-publish</p>
          <p className="mt-2 text-lg">
            {process.env.CRON_AUTO_PUBLISH === "true"
              ? "enabled"
              : "draft-only"}
          </p>
        </Card>
        <Card>
          <p className="font-data text-xs text-ink-muted">server time (UTC)</p>
          <p className="mt-2 text-lg">{new Date().toISOString()}</p>
        </Card>
      </div>
    </div>
  );
}
