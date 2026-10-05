"use client";

import { useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/articles", label: "Articles" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-[background-color,border-color,backdrop-filter] duration-300 motion-reduce:transition-none ${
        scrolled || open
          ? "border-line bg-bg/70 backdrop-blur-xl backdrop-saturate-150"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-extrabold uppercase tracking-tight"
        >
          Bintang<span className="text-block-yellow">.</span>Mesir
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden items-center gap-7 text-sm font-medium lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ink-muted transition-colors hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <Link
            href="/#contact-footer"
            className="pill pill-accent pill-sm hidden sm:inline-flex"
          >
            Contact
          </Link>
          {/* Di mobile, tombol dibungkus latar solid supaya tetap terlihat di atas
              section berwarna (mis. kartu kuning Contact) dan footer gelap. */}
          <div className="flex items-center gap-2 max-lg:rounded-full max-lg:bg-bg/90 max-lg:p-1 max-lg:shadow-sm max-lg:ring-1 max-lg:ring-line">
            <ThemeToggle />
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </nav>
      {open && (
        <div className="border-t border-line px-4 py-5 lg:hidden">
          <div className="flex flex-col gap-4 text-lg font-semibold">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link
              href="/#contact-footer"
              onClick={() => setOpen(false)}
              className="pill pill-accent mt-2 w-fit"
            >
              Contact
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
