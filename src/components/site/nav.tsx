"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#experience", label: "Experience" },
  { href: "/#projects", label: "Projects" },
  { href: "/articles", label: "Articles" },
];

// Contact lives in the footer now (every page), not as its own nav item/page —
// and no /login link here either, see SECURITY.md + footer.tsx.
export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link
          href="/"
          className="font-data text-sm tracking-tight text-ink hover:text-accent"
        >
          BINTANG<span className="text-accent">.</span>MESIR
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden items-center gap-8 text-sm md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ink-muted hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <ThemeToggle />
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-line text-ink-muted md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-line px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4 text-sm">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ink-muted hover:text-ink"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
