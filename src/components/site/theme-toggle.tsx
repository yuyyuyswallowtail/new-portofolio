"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useLayoutEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
const ORDER: Theme[] = ["light", "dark", "system"];
const ICON = { system: Monitor, light: Sun, dark: Moon };

function paint(t: Theme) {
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // React 19 membersihkan atribut <html> saat hydration, jadi tema harus
  // diterapkan ulang di sini, bukan hanya oleh skrip inline di <head>.
  useLayoutEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("theme");
    } catch {}
    const t: Theme = saved === "dark" || saved === "system" ? saved : "light";
    setTheme(t);
    paint(t);
    setMounted(true);
  }, []);

  function apply(next: Theme) {
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    paint(next);
  }

  function cycle() {
    const idx = ORDER.indexOf(theme);
    apply(ORDER[(idx + 1) % ORDER.length] ?? "light");
  }

  // Hindari render ikon yang bergantung tema sebelum mount (mismatch SSR).
  if (!mounted) {
    return <div className="h-8 w-8" aria-hidden="true" />;
  }

  const Icon = ICON[theme];
  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${theme} (click to change)`}
      aria-label={`Theme: ${theme}. Click to change.`}
      className="flex h-8 w-8 items-center justify-center rounded-[6px] text-ink hover:border-accent hover:text-accent"
    >
      <Icon size={15} />
    </button>
  );
}
