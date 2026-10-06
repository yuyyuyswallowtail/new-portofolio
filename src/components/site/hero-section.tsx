"use client";

import { motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CrtBackdrop, CrtOverlay } from "./crt-backdrop";
import { useIntroDone } from "./intro";
import { Marquee } from "./marquee";
import { EASE, RevealText } from "./motion";

const HERO_BAND = ["Software Engineer", "Full Stack", "Web Developer"];

// Three.js + Rapier hanya dimuat di browser, dan hanya untuk beranda.
const Lanyard = dynamic(() => import("./lanyard"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function HeroSection({
  name,
  tagline,
  domicile,
  cvUrl,
  profileUrl,
}: {
  name: string;
  tagline: string;
  domicile: string | null;
  cvUrl: string | null;
  profileUrl: string | null;
}) {
  const reduce = useReducedMotion();
  const introDone = useIntroDone();
  const stageRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"pending" | "3d" | "static">("pending");

  useEffect(() => {
    setMode(reduce || !hasWebGL() ? "static" : "3d");
  }, [reduce]);

  const rise = (delay: number) => ({
    initial: reduce ? (false as const) : { opacity: 0, y: 24 },
    animate: introDone || reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  return (
    <>
      <CrtBackdrop />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-6 pb-10 pt-28 md:grid-cols-[1.35fr_1fr]">
        {/* Teks: di bawah lanyard pada mobile, di kiri pada desktop */}
        <div className="order-2 md:order-1">
          <motion.p className="kicker" {...rise(0.05)}>
            / Software Engineer &amp; Full Stack Web Developer
          </motion.p>
          <div className="relative mt-6">
            <Marquee
              items={HERO_BAND}
              behind
              tilt={-6}
              reverse
              slow
              size="md"
            />
            <h1 className="display-xl crt-text title-on-band break-words">
              {introDone || reduce ? (
                <RevealText text={name} delay={0.1} />
              ) : (
                <span className="invisible">{name}</span>
              )}
            </h1>
          </div>
          <motion.p
            className="mt-8 line-clamp-3 max-w-xl text-lg leading-relaxed text-ink-muted md:text-xl"
            {...rise(0.45)}
          >
            {tagline}
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-3" {...rise(0.58)}>
            <Link href="/projects" className="pill pill-solid">
              View projects →
            </Link>
            {cvUrl && (
              <a href={cvUrl} className="pill pill-outline">
                Download CV
              </a>
            )}
          </motion.div>
          {domicile && (
            <motion.p
              className="font-data mt-6 text-xs text-ink-muted"
              {...rise(0.7)}
            >
              based in {domicile}
            </motion.p>
          )}
        </div>

        {/* Stage: hanya penanda posisi + sumber event pointer. Canvas 3D digambar di lapisan terpisah. */}
        <div
          ref={stageRef}
          className="relative order-1 h-[400px] w-full touch-pan-y sm:h-[460px] md:order-2 md:h-[clamp(420px,62vh,620px)]"
        >
          {mode === "3d" && (
            <p
              aria-hidden="true"
              className="font-data pointer-events-none absolute inset-x-0 bottom-0 text-center text-xs text-ink-muted"
            >
              drag the card ✦
            </p>
          )}
          {mode === "static" && (
            <div className="relative mx-auto mt-10 aspect-[4/5] w-64 overflow-hidden rounded-[32px] bg-block-yellow text-on-block sm:w-72">
              {profileUrl ? (
                <Image
                  src={profileUrl}
                  alt={name}
                  fill
                  priority
                  className="object-cover object-top"
                  sizes="288px"
                />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-8xl font-extrabold">
                  {name.slice(0, 1)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <CrtOverlay />

      {/* Lanyard: satu canvas selebar hero, z-index di atas semua konten, tali dari tepi atas (di belakang navbar). */}
      {mode === "3d" && (
        <Lanyard
          name={name}
          title="Software Engineer"
          photoUrl={profileUrl}
          eventSource={stageRef}
        />
      )}
    </>
  );
}
