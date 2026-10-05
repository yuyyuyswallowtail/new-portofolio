"use client";

import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Judul besar: tiap kata naik dari balik mask saat masuk viewport. */
export function RevealText({
  text,
  delay = 0,
  className,
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const show = inView || !!reduce;
  const words = text.split(" ").map((w, i) => ({ w, id: `${i}-${w}` }));

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      {words.map((item, i) => (
        <Fragment key={item.id}>
          <span
            aria-hidden="true"
            className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-top"
          >
            <motion.span
              className="inline-block"
              initial={{ y: "115%" }}
              animate={{ y: show ? "0%" : "115%" }}
              transition={{
                duration: reduce ? 0 : 0.8,
                ease: EASE,
                delay: reduce ? 0 : delay + i * 0.045,
              }}
            >
              {item.w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}

/** Container: anak-anaknya (StaggerItem) muncul berurutan, satu gerakan terkoordinasi. */
export function Stagger({
  children,
  className,
  gap = 0.08,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 32 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Gambar/blok terbuka dari atas ke bawah (clip-path) saat masuk viewport. */
export function ClipReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // Observer di wrapper yang tidak ter-clip, supaya tetap terdeteksi di viewport sempit.
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const show = inView || !!reduce;

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={reduce ? false : { clipPath: "inset(0 0 100% 0)" }}
        animate={{
          clipPath: show ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
        }}
        transition={{ duration: reduce ? 0 : 1, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Angka menghitung naik dari 0 saat masuk viewport. */
export function CountUp({
  value,
  className,
  pad = 2,
}: {
  value: number;
  className?: string;
  pad?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduce) {
      setN(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={className}>
      {String(n).padStart(pad, "0")}
    </span>
  );
}

/** Mengisi parent (harus relative + overflow-hidden): isinya bergeser pelan mengikuti scroll. */
export function ParallaxFill({
  children,
  amount = 6,
}: {
  children: ReactNode;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`-${amount}%`, `${amount}%`],
  );

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-x-0"
        style={{
          top: `-${amount + 2}%`,
          bottom: `-${amount + 2}%`,
          y: reduce ? 0 : y,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Item yang sedang di tengah layar tampil penuh, sisanya meredup (aktif/nonaktif, reversibel). */
export function ActiveOnScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useInView(ref, { margin: "-40% 0px -40% 0px" });
  return (
    <div
      ref={ref}
      className={cn(
        "transition-opacity duration-500 motion-reduce:transition-none",
        active ? "opacity-100" : "opacity-60",
        className,
      )}
    >
      {children}
    </div>
  );
}
