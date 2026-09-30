import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isStaff } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/modules/auth/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Role-aware nav per ARCHITECTURE.md §4 step 3 — viewer role has no dashboard use case yet (PRD.md §4).
  if (!isStaff(user.role) && user.role !== "editor") redirect("/");

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-data text-sm text-accent">
              ~/dashboard
            </Link>
            <Link
              href="/dashboard/articles"
              className="text-sm text-ink hover:text-accent"
            >
              Articles
            </Link>
            {isStaff(user.role) && (
              <Link
                href="/dashboard/users"
                className="text-sm text-ink hover:text-accent"
              >
                Users
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-data text-xs text-ink-muted">
              {user.email} · {user.role}
            </span>
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
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
