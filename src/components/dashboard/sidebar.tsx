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
  PanelLeftClose,
  PanelLeftOpen,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FloatingWireframe } from "@/components/site/floating-wireframe";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  staffOnly?: boolean;
};

const STORAGE_KEY = "dashboard-sidebar-collapsed";

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage tidak tersedia: tetap terbuka
    }
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // abaikan: pilihan hanya berlaku untuk sesi ini
    }
  }

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col self-start border-r border-line transition-[width] duration-200 motion-reduce:transition-none",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-line py-5",
          collapsed ? "justify-center" : "gap-2 px-5",
        )}
      >
        <FloatingWireframe size={24} />
        {!collapsed && (
          <span className="font-data text-sm text-accent">~/dashboard</span>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {ITEMS.filter((item) => !item.staffOnly || isStaff).map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const badge =
            item.href === "/dashboard/comments" ? pendingComments : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-[6px] py-2 text-sm transition-colors",
                collapsed ? "justify-center px-0" : "gap-3 px-3",
                active
                  ? "bg-surface text-accent"
                  : "text-ink-muted hover:bg-surface hover:text-ink",
              )}
            >
              <span className="relative">
                <Icon size={16} />
                {collapsed && badge > 0 && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-warn" />
                )}
              </span>
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="font-data rounded-full bg-warn px-1.5 text-xs text-[#1a1203]">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex h-9 w-full items-center rounded-[6px] text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink",
            collapsed ? "justify-center" : "gap-3 px-3",
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <>
              <PanelLeftClose size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
