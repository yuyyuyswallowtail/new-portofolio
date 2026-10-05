"use client";

import { useMotionValueEvent, useScroll } from "framer-motion";
import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Section setinggi layar yang menempel di atas; section berikutnya naik
 * menutupinya. Section yang lebih tinggi dari layar menempel saat dasarnya
 * mencapai dasar viewport (top negatif), jadi seluruh isinya tetap terbaca.
 * Hanya aktif di md ke atas dan tanpa reduced-motion. Syarat: parent tidak
 * boleh punya overflow, dan section berikutnya harus sibling langsung.
 */
export function StackSection({
  id,
  index,
  tone = "bg",
  bare = false,
  children,
}: {
  id?: string;
  index: number;
  tone?: "bg" | "surface";
  bare?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      if (!window.matchMedia("(min-width: 768px)").matches) {
        el.style.top = "";
        return;
      }
      el.style.top = `${Math.min(0, window.innerHeight - el.offsetHeight)}px`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Seberapa jauh section berikutnya sudah menutupi section ini (0..1).
  const cover = useCallback(() => {
    const el = ref.current;
    const inner = innerRef.current;
    const next = el?.nextElementSibling;
    if (!el || !inner || !next) return;

    const enabled = window.matchMedia(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
    ).matches;
    if (!enabled) {
      inner.style.transform = "";
      inner.style.opacity = "";
      return;
    }
    const p = Math.min(
      1,
      Math.max(0, 1 - next.getBoundingClientRect().top / window.innerHeight),
    );
    inner.style.transform = p > 0 ? `scale(${1 - 0.05 * p})` : "";
    inner.style.opacity = p > 0 ? String(1 - 0.55 * p) : "";
  }, []);

  useMotionValueEvent(scrollY, "change", cover);
  useEffect(() => {
    cover();
  }, [cover]);

  return (
    <section
      ref={ref}
      id={id}
      style={{ zIndex: index + 1 }}
      className={cn(
        "relative border-t border-line md:sticky md:flex md:min-h-screen md:flex-col motion-reduce:static",
        tone === "surface" ? "bg-surface" : "bg-bg",
        index === 0 && "px-3 pt-3 pb-3 md:px-5 md:pt-5 md:pb-5",
        index > 0 &&
          "rounded-t-[28px] shadow-[0_-24px_48px_-28px_rgb(0_0_0/0.35)] md:rounded-t-[40px]",
      )}
    >
      <div
        ref={innerRef}
        className={cn(
          "relative isolate flex w-full flex-1 flex-col",
          bare
            ? "pb-24 md:pb-44"
            : "mx-auto max-w-6xl justify-center px-6 pt-20 pb-20 md:pt-28 md:pb-64",
        )}
      >
        {children}
      </div>
    </section>
  );
}
