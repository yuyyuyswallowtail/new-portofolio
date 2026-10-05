"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { markIntroActive, markIntroDone } from "./intro";

type Phase = "idle" | "intro" | "in" | "out";

const EASE: [number, number, number, number] = [0.76, 0, 0.24, 1];
// Area yang tidak memakai transisi (dashboard dan login tetap navigasi biasa).
const SKIP = ["/dashboard", "/login", "/api", "/uploads"];

function skip(pathname: string) {
  return SKIP.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function labelFor(pathname: string) {
  if (pathname === "/") return "Home";
  if (pathname === "/articles") return "Articles";
  if (pathname.startsWith("/articles/")) return "Article";
  return "";
}

/**
 * Dua panel menutup layar (menyapu naik), label tujuan muncul, navigasi
 * berjalan saat layar tertutup, lalu panel menyapu keluar. Overlay juga
 * dirender di server untuk setiap load/reload halaman publik ("intro"), jadi
 * konten tertutup sejak paint pertama lalu dibuka setelah halaman siap.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(() =>
    skip(pathname) ? "idle" : "intro",
  );
  const [label, setLabel] = useState("Bintang.Mesir");
  const phaseRef = useRef<Phase>(phase);
  const targetRef = useRef<string | null>(null);
  const pushedRef = useRef(false);
  const fromRef = useRef("");

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    if (next === "in") markIntroActive();
    setPhase(next);
  }, []);

  // Intro saat load/reload: tahan minimal 1 detik, tunggu halaman selesai dimuat (maks. 3,5 detik).
  useEffect(() => {
    if (phaseRef.current !== "intro") return;
    markIntroActive();
    if (reduce) {
      go("idle");
      markIntroDone();
      return;
    }
    let cancelled = false;
    const minWait = new Promise<void>((r) => window.setTimeout(r, 1000));
    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((r) =>
            window.addEventListener("load", () => r(), { once: true }),
          );
    const cap = new Promise<void>((r) => window.setTimeout(r, 3500));
    Promise.race([Promise.all([minWait, loaded]), cap]).then(() => {
      if (!cancelled) go("out");
    });
    return () => {
      cancelled = true;
    };
  }, [reduce, go]);

  // Cegat klik link internal di fase capture.
  useEffect(() => {
    if (reduce) return;

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (phaseRef.current !== "idle") return;

      const anchor = (e.target as Element | null)?.closest("a");
      if (!anchor) return;
      if (!anchor.getAttribute("href")) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      if (skip(url.pathname) || skip(window.location.pathname)) return;

      e.preventDefault();
      e.stopPropagation();
      targetRef.current = `${url.pathname}${url.search}${url.hash}`;
      fromRef.current = window.location.pathname;
      setLabel(labelFor(url.pathname));
      go("in");
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [reduce, go]);

  // Layar sudah tertutup: pindah halaman. Fallback 4 detik kalau rute tak kunjung berganti.
  function afterCover() {
    const target = targetRef.current;
    if (!target) {
      go("out");
      return;
    }
    targetRef.current = null;
    pushedRef.current = true;
    router.push(target);
    window.setTimeout(() => {
      if (phaseRef.current === "in" && pushedRef.current) {
        pushedRef.current = false;
        go("out");
      }
    }, 4000);
  }

  // Rute sudah berganti: beri jeda singkat agar halaman baru ter-paint, lalu buka layar.
  useEffect(() => {
    if (phaseRef.current !== "in" || !pushedRef.current) return;
    if (pathname === fromRef.current) return;
    pushedRef.current = false;
    const t = window.setTimeout(() => go("out"), 150);
    return () => window.clearTimeout(t);
  }, [pathname, go]);

  const exiting = phase === "out";
  const timing = (delay: number) => ({ duration: 0.65, ease: EASE, delay });
  // Saat intro, panel sudah menutup sejak render pertama (tanpa animasi masuk).
  const startY = phaseRef.current === "intro" ? "0%" : "100%";

  return (
    <>
      {children}
      {phase !== "idle" && (
        <div className="site-intro fixed inset-0 z-[100]" aria-hidden="true">
          <noscript>
            <style>{".site-intro{display:none}"}</style>
          </noscript>
          <motion.div
            className="absolute inset-0 bg-block-yellow"
            initial={{ y: startY }}
            animate={{ y: exiting ? "-100%" : "0%" }}
            transition={timing(exiting ? 0.1 : 0)}
            onAnimationComplete={() => {
              if (exiting) {
                go("idle");
                markIntroDone();
              }
            }}
          />
          <motion.div
            className="absolute inset-0 grid place-items-center bg-ink text-bg"
            initial={{ y: startY }}
            animate={{ y: exiting ? "-100%" : "0%" }}
            transition={timing(exiting ? 0 : 0.1)}
            onAnimationComplete={() => {
              if (phaseRef.current === "in") afterCover();
            }}
          >
            {label && (
              <motion.p
                className="display-lg px-6 text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: exiting ? 0 : 1,
                  y: exiting ? -30 : 0,
                }}
                transition={{
                  duration: 0.4,
                  ease: EASE,
                  delay: exiting ? 0 : 0.4,
                }}
              >
                {label}
              </motion.p>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
}
