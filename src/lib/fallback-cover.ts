import "server-only";
import { generateCoverImage } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import { generatePollinationsCover } from "@/lib/pollinations";

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cover SVG lokal (16:9), deterministik per judul. Tanpa teks, tanpa API. */
export function generateFallbackCover(title: string): string {
  const rand = rng(hashString(title));
  const W = 1280;
  const H = 720;
  const nodes = Array.from({ length: 18 }, () => ({
    x: 80 + rand() * (W - 160),
    y: 60 + rand() * (H - 120),
    r: 4 + rand() * 9,
  }));

  let lines = "";
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (!a || !b) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 280) {
        const o = (0.5 * (1 - d / 280)).toFixed(2);
        lines += `<line x1="${a.x.toFixed(0)}" y1="${a.y.toFixed(0)}" x2="${b.x.toFixed(0)}" y2="${b.y.toFixed(0)}" stroke="#2dd4bf" stroke-opacity="${o}" stroke-width="1.5"/>`;
      }
    }
  }
  const dots = nodes
    .map(
      (n, i) =>
        `<circle cx="${n.x.toFixed(0)}" cy="${n.y.toFixed(0)}" r="${n.r.toFixed(1)}" fill="${i % 5 === 0 ? "#2dd4bf" : "#1c2a33"}" stroke="#2dd4bf" stroke-opacity="0.6"/>`,
    )
    .join("");
  const glowX = (200 + rand() * 880).toFixed(0);
  const glowY = (150 + rand() * 420).toFixed(0);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><radialGradient id="g" cx="${glowX}" cy="${glowY}" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2dd4bf" stop-opacity="0.22"/><stop offset="1" stop-color="#2dd4bf" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="#0b0f14"/><rect width="${W}" height="${H}" fill="url(#g)"/>${lines}${dots}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Urutan: Gemini (kecuali GEMINI_IMAGE_ENABLED=false) -> Pollinations
 * (kecuali POLLINATIONS_ENABLED=false) -> SVG lokal.
 */
export async function generateCoverOrFallback(title: string): Promise<string> {
  if (process.env.GEMINI_IMAGE_ENABLED !== "false") {
    try {
      return await generateCoverImage(title);
    } catch (err) {
      logger.warn("cover_image_fallback_used", {
        error: (err as Error).message.slice(0, 300),
      });
    }
  }
  if (process.env.POLLINATIONS_ENABLED !== "false") {
    try {
      return await generatePollinationsCover(title);
    } catch (err) {
      logger.warn("pollinations_cover_failed", {
        error: (err as Error).message.slice(0, 300),
      });
    }
  }
  return generateFallbackCover(title);
}
