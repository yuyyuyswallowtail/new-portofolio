"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    __introDone?: boolean;
  }
}

export const INTRO_EVENT = "site-intro-done";

/** Dipanggil saat layar penutup mulai menutup: komponen lain diminta menunggu. */
export function markIntroActive() {
  window.__introDone = false;
}

/** Dipanggil saat layar penutup selesai terbuka. */
export function markIntroDone() {
  window.__introDone = true;
  window.dispatchEvent(new Event(INTRO_EVENT));
}

/**
 * true setelah intro/transisi selesai. Ada fallback 4,5 detik supaya animasi
 * tetap jalan kalau sinyalnya tidak pernah datang.
 */
export function useIntroDone(): boolean {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.__introDone === true) {
      setDone(true);
      return;
    }
    const on = () => setDone(true);
    window.addEventListener(INTRO_EVENT, on);
    const fallback = window.setTimeout(on, 4500);
    return () => {
      window.removeEventListener(INTRO_EVENT, on);
      window.clearTimeout(fallback);
    };
  }, []);

  return done;
}
