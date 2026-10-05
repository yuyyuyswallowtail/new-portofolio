import { redirect } from "next/navigation";
import { AnalyticsBar } from "@/components/dashboard/analytics-bar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { Button } from "@/components/ui/button";
import { isStaff } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";
import { getDashboardAnalytics } from "@/modules/analytics/service";
import { logoutAction } from "@/modules/auth/actions";
import { pendingCount as pendingCommentCount } from "@/modules/comments/service";

// Gagal cepat kalau ada query yang menggantung (default Vercel 300 detik).
export const maxDuration = 30;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Role-aware nav per ARCHITECTURE.md §4 step 3 — viewer role has no dashboard use case yet (PRD.md §4).
  if (!isStaff(user.role) && user.role !== "editor") redirect("/");

  const [analytics, pendingComments] = await Promise.all([
    getDashboardAnalytics(),
    isStaff(user.role) ? pendingCommentCount() : Promise.resolve(0),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar isStaff={isStaff(user.role)} pendingComments={pendingComments} />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <span className="font-data text-xs text-ink-muted">
            {user.email} · {user.role}
          </span>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <form
              action={async () => {
                "use server";
                await logoutAction();
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </header>
        <main className="px-6 py-8">
          {/* Required on every admin page — not just /dashboard home */}
          <AnalyticsBar data={analytics} />
          {children}
        </main>
      </div>
    </div>
  );
}
