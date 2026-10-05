"use client";

import type { Body as MatterBody } from "matter-js";
import { useEffect, useRef, useState } from "react";

export type PileSkill = { id: string; name: string; logoUrl: string | null };

type MatterModule = typeof import("matter-js");

const TILE = 96;
const TILE_SMALL = 76;
const STEP_MS = 1000 / 60;
const CARD_BG = "#f4f3ea";
const CARD_INK = "#16181d";
const FONT = "ui-sans-serif, system-ui, sans-serif";

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Kotak gelap berisi tumpukan "sticker" logo skill yang jatuh dan bisa
 * diseret (Matter.js, dimuat dinamis hanya saat dibutuhkan).
 */
export function SkillPile({
  items,
  title = "The toolbox",
  hint = "drag the stickers ✦",
}: {
  items: PileSkill[];
  title?: string;
  hint?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas || items.length === 0) return;

    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      const mod = await import("matter-js");
      if (disposed) return;
      const Matter = ((mod as unknown as { default?: MatterModule }).default ??
        mod) as MatterModule;
      const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint } =
        Matter;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let width = wrap.clientWidth;
      const height = wrap.clientHeight;
      const tile = width < 640 ? TILE_SMALL : TILE;
      const radius = tile * 0.22;

      const sizeCanvas = () => {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      };
      sizeCanvas();

      const engine = Engine.create();
      engine.gravity.y = 1.2;

      const makeWalls = (w: number) => [
        Bodies.rectangle(w / 2, height + 100, w * 3, 200, { isStatic: true }),
        Bodies.rectangle(-100, 0, 200, height * 6, { isStatic: true }),
        Bodies.rectangle(w + 100, 0, 200, height * 6, { isStatic: true }),
      ];
      let walls = makeWalls(width);
      Composite.add(engine.world, walls);

      const images = new Map<string, HTMLImageElement>();
      for (const it of items) {
        if (!it.logoUrl) continue;
        const img = new Image();
        img.src = it.logoUrl;
        images.set(it.id, img);
      }

      const pile: { body: MatterBody; item: PileSkill }[] = [];
      const timers: number[] = [];
      let spawned = false;
      let visible = false;

      const spawn = () => {
        if (spawned) return;
        spawned = true;
        items.forEach((item, i) => {
          timers.push(
            window.setTimeout(() => {
              if (disposed) return;
              const x = tile / 2 + Math.random() * Math.max(width - tile, 1);
              const body = Bodies.rectangle(
                x,
                -tile - Math.random() * 60,
                tile,
                tile,
                {
                  chamfer: { radius },
                  restitution: 0.35,
                  friction: 0.5,
                  frictionAir: 0.008,
                  angle: (Math.random() - 0.5) * 0.9,
                },
              );
              Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);
              Composite.add(engine.world, body);
              pile.push({ body, item });
            }, i * 90),
          );
        });
      };

      // Drag hanya untuk pointer presisi (mouse). Di layar sentuh, biarkan scroll normal.
      if (window.matchMedia("(pointer: fine)").matches) {
        const mouse = Mouse.create(canvas);
        Mouse.setScale(mouse, { x: 1 / dpr, y: 1 / dpr });
        const wheel = (mouse as unknown as { mousewheel: EventListener })
          .mousewheel;
        canvas.removeEventListener("mousewheel", wheel);
        canvas.removeEventListener("DOMMouseScroll", wheel);
        canvas.removeEventListener("wheel", wheel);
        const drag = MouseConstraint.create(engine, {
          mouse,
          constraint: { stiffness: 0.2, render: { visible: false } },
        });
        Composite.add(engine.world, drag);
      }

      const draw = () => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        for (const { body, item } of pile) {
          ctx.save();
          ctx.translate(body.position.x, body.position.y);
          ctx.rotate(body.angle);

          ctx.fillStyle = CARD_BG;
          roundedRectPath(ctx, -tile / 2, -tile / 2, tile, tile, radius);
          ctx.fill();

          const img = images.get(item.id);
          if (img && img.complete && img.naturalWidth > 0) {
            const s = tile * 0.5;
            ctx.drawImage(img, -s / 2, -s / 2 - tile * 0.08, s, s);
          } else {
            ctx.fillStyle = CARD_INK;
            ctx.font = `700 ${Math.round(tile * 0.36)}px ${FONT}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(item.name.slice(0, 2), 0, -tile * 0.1);
          }

          ctx.fillStyle = CARD_INK;
          ctx.font = `600 ${Math.max(Math.round(tile * 0.12), 9)}px ${FONT}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(item.name, 0, tile * 0.38, tile * 0.86);
          ctx.restore();
        }
      };

      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            visible = e.isIntersecting;
            if (e.isIntersecting) spawn();
          }
        },
        { threshold: 0.3 },
      );
      io.observe(wrap);

      const ro = new ResizeObserver(() => {
        const w = wrap.clientWidth;
        if (w === width || w === 0) return;
        width = w;
        sizeCanvas();
        for (const wall of walls) Composite.remove(engine.world, wall);
        walls = makeWalls(width);
        Composite.add(engine.world, walls);
        for (const { body } of pile) {
          if (body.position.x > width - tile / 2) {
            Body.setPosition(body, {
              x: width - tile,
              y: Math.min(body.position.y, height - tile),
            });
          }
        }
      });
      ro.observe(wrap);

      let last = performance.now();
      let acc = 0;
      let raf = 0;
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        const delta = Math.min(now - last, 100);
        last = now;
        if (!visible) return;
        acc += delta;
        while (acc >= STEP_MS) {
          Engine.update(engine, STEP_MS);
          acc -= STEP_MS;
        }
        draw();
      };
      raf = requestAnimationFrame(loop);

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        for (const t of timers) window.clearTimeout(t);
        Composite.clear(engine.world, false);
        Engine.clear(engine);
      };
    };

    void start();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [reduced, items]);

  if (reduced) {
    return (
      <ul className="flex flex-wrap gap-3">
        {items.map((it) => (
          <li
            key={it.id}
            className="flex items-center gap-2 rounded-2xl bg-[#f4f3ea] px-3 py-2 text-sm font-medium text-[#16181d]"
          >
            {it.logoUrl && (
              // biome-ignore lint/performance/noImgElement: logo kecil (128px), optimasi next/image tidak perlu
              <img
                src={it.logoUrl}
                alt=""
                width={24}
                height={24}
                loading="lazy"
              />
            )}
            {it.name}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="relative h-[460px] overflow-hidden rounded-[28px] border border-white/10 bg-[#111214] md:h-[500px]"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block h-full w-full cursor-grab active:cursor-grabbing"
      />
      <div className="pointer-events-none absolute left-6 top-6 md:left-8 md:top-8">
        <p className="text-3xl font-semibold leading-none tracking-tight text-[#f4f3ea] md:text-5xl">
          {title}
        </p>
        <p className="font-data mt-3 text-xs text-[#f4f3ea]/60">{hint}</p>
      </div>
      <ul className="sr-only">
        {items.map((it) => (
          <li key={it.id}>{it.name}</li>
        ))}
      </ul>
    </div>
  );
}
