"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { SectionHeading } from "./section-heading";

export type CertItem = {
  id: string;
  title: string;
  issuer: string | null;
  imageUrl: string;
  verifyUrl: string | null;
};

/** Scroll vertikal menggeser galeri ke samping; hanya sertifikat aktif yang diberi caption. */
export function CertGallery({
  items,
  index,
}: {
  items: CertItem[];
  index: number;
}) {
  const n = items.length;
  const wrapRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const targets = useRef<number[]>([]);
  const x = useMotionValue(0);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  const sync = useCallback(
    (p: number) => {
      const t = targets.current;
      if (t.length < 2) return;
      const f = Math.min(1, Math.max(0, p)) * (n - 1);
      const i = Math.min(n - 2, Math.floor(f));
      const a = t[i] ?? 0;
      const b = t[i + 1] ?? a;
      x.set(a + (b - a) * (f - i));
    },
    [n, x],
  );

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    sync(p);
    setActive(Math.round(Math.min(1, Math.max(0, p)) * (n - 1)));
  });

  useEffect(() => {
    const track = trackRef.current;
    const stage = stickyRef.current;
    if (!track || !stage) return;
    const measure = () => {
      const vw = stage.clientWidth;
      targets.current = (Array.from(track.children) as HTMLElement[]).map(
        (k) => vw / 2 - (k.offsetLeft + k.offsetWidth / 2),
      );
      sync(scrollYProgress.get());
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [sync, scrollYProgress]);

  const current = items[active];

  return (
    <div ref={wrapRef} style={{ height: `${Math.max(0, n - 1) * 50 + 100}vh` }}>
      <div
        ref={stickyRef}
        className="sticky top-0 flex h-screen flex-col overflow-hidden"
      >
        <div className="mx-auto w-full max-w-6xl px-6 pt-20 md:pt-24">
          <SectionHeading index={index} title="Certifications" />
        </div>

        <div className="flex flex-1 items-center [perspective:1400px]">
          <motion.div
            ref={trackRef}
            style={{ x }}
            className="relative flex w-max items-center gap-6 md:gap-10"
          >
            {items.map((c, i) => {
              const state = i === active ? 0 : i < active ? 1 : -1;
              return (
                <div
                  key={c.id}
                  className="aspect-[4/3] h-[min(36vh,400px)] shrink-0 transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none"
                  style={{
                    transform: `rotateY(${state * 24}deg) scale(${state === 0 ? 1 : 0.82})`,
                    opacity: state === 0 ? 1 : 0.4,
                  }}
                >
                  {/* biome-ignore lint/performance/noImgElement: sertifikat bisa berupa upload lokal */}
                  <img
                    src={c.imageUrl}
                    alt={c.title}
                    loading="lazy"
                    className="h-full w-full rounded-[10px] object-cover"
                  />
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl items-end justify-between gap-6 px-6 pb-10">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="min-w-0"
              >
                <p className="text-base font-medium md:text-xl">
                  {current.title}
                </p>
                <p className="font-data mt-1 text-xs text-ink-muted">
                  {current.issuer}
                  {current.verifyUrl && (
                    <>
                      {" · "}
                      <a
                        href={current.verifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent-strong hover:underline"
                      >
                        verify ↗
                      </a>
                    </>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="font-data shrink-0 text-3xl md:text-5xl">
            <span className="text-ink-muted">/</span>
            {String(active + 1).padStart(2, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
