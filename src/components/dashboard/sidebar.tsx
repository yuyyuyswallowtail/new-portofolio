"use client";

import {
  Activity,
  Award,
  Briefcase,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FloatingWireframe } from "@/components/site/floating-wireframe";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  staffOnly?: boolean;
};

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/articles", label: "Articles", icon: Newspaper },
  {
    href: "/dashboard/comments",
    label: "Comments",
    icon: MessageSquare,
    staffOnly: true,
  },
  { href: "/dashboard/profile", label: "Profile", icon: UserCog },
  {
    href: "/dashboard/education",
    label: "Education",
    icon: GraduationCap,
    staffOnly: true,
  },
  {
    href: "/dashboard/experience",
    label: "Experience",
    icon: Briefcase,
    staffOnly: true,
  },
  {
    href: "/dashboard/certifications",
    label: "Certifications",
    icon: Award,
    staffOnly: true,
  },
  {
    href: "/dashboard/skills",
    label: "Skills",
    icon: Wrench,
    staffOnly: true,
  },
  {
    href: "/dashboard/projects",
    label: "Projects",
    icon: FolderOpen,
    staffOnly: true,
  },
  { href: "/dashboard/users", label: "Users", icon: Users, staffOnly: true },
  {
    href: "/dashboard/system",
    label: "System",
    icon: Activity,
    staffOnly: true,
  },
];

export function Sidebar({
  isStaff,
  pendingComments = 0,
}: {
  isStaff: boolean;
  pendingComments?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line">
      <div className="flex items-center gap-2 border-b border-line px-5 py-5">
        <FloatingWireframe size={24} />
        <span className="font-data text-sm text-accent">~/dashboard</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {ITEMS.filter((item) => !item.staffOnly || isStaff).map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const badge =
            item.href === "/dashboard/comments" ? pendingComments : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[6px] px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-surface text-accent"
                  : "text-ink-muted hover:bg-surface hover:text-ink",
              )}
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="font-data rounded-full bg-warn px-1.5 text-xs text-[#1a1203]">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
