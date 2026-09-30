import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardHome() {
  const user = await getCurrentUser();
  return (
    <div>
      <h1 className="text-2xl font-semibold">
        Welcome, {user?.name ?? user?.email}
      </h1>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="font-data text-xs text-ink-muted">role</p>
          <p className="mt-1 text-lg">{user?.role}</p>
        </Card>
      </div>
    </div>
  );
}
