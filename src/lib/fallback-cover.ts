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

type Topic = { match: RegExp; motif: string; accent: string };

// Topik dideteksi dari judul. Urutan penting: yang cocok pertama dipakai.
const TOPICS: Topic[] = [
  {
    match: /laravel|symfony|composer|\bphp\b/i,
    motif: "<?php",
    accent: "#ff6b5e",
  },
  {
    match: /python|django|flask|fastapi|pandas/i,
    motif: ">>>",
    accent: "#ffd43b",
  },
  {
    match: /typescript|javascript|node\.?js|\bdeno\b|\bbun\b/i,
    motif: "{ }",
    accent: "#f7df1e",
  },
  {
    match: /react|next\.?js|\bvue\b|svelte|tailwind|\bcss\b|\bhtml\b|frontend/i,
    motif: "</>",
    accent: "#38bdf8",
  },
  {
    match: /sql|postgres|mysql|database|supabase|mongo|redis|\borm\b/i,
    motif: "SELECT",
    accent: "#60a5fa",
  },
  {
    match: /docker|kubernetes|devops|deploy|\bci\b|cloud|serverless/i,
    motif: "$ _",
    accent: "#34d399",
  },
  {
    match:
      /network|\btcp\b|\budp\b|\bdns\b|\bhttp\b|router|\bvpn\b|firewall|\bip\b|subnet/i,
    motif: "10.0.0.1",
    accent: "#4ade80",
  },
  {
    match: /security|auth|encrypt|owasp|vulnerab|zero.?trust/i,
    motif: "0xFF",
    accent: "#f472b6",
  },
  {
    match:
      /\bai\b|\bllm\b|machine learning|neural|\bgpt\b|gemini|claude|transformer/i,
    motif: "f(x)",
    accent: "#c084fc",
  },
  {
    match: /test|tdd|quality|benchmark|performance/i,
    motif: "assert",
    accent: "#fb923c",
  },
];
const DEFAULT_TOPIC = { motif: "</>", accent: "#2dd4bf" };

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapTitle(title: string, maxChars: number, maxLines: number): string[] {
  const words = title.trim().split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${(kept[maxLines - 1] ?? "").replace(/[\s.,:;–-]+$/, "")}…`;
    return kept;
  }
  return lines;
}

/**
 * Cover SVG lokal (16:9), deterministik per judul dan spesifik per topik:
 * warna aksen, simbol besar, label topik, dan judul artikel. Tanpa API.
 */
export function generateFallbackCover(title: string): string {
  const rand = rng(hashString(title));
  const W = 1280;
  const H = 720;

  const found = TOPICS.map((t) => ({ t, m: title.match(t.match) })).find(
    (x) => x.m,
  );
  const motif = found?.t.motif ?? DEFAULT_TOPIC.motif;
  const accent = found?.t.accent ?? DEFAULT_TOPIC.accent;
  const label = (found?.m?.[0] ?? "WRITING").toUpperCase().slice(0, 16);

  const glowX = (760 + rand() * 400).toFixed(0);
  const glowY = (110 + rand() * 240).toFixed(0);
  const motifSize = Math.min(300, Math.floor(1000 / (motif.length * 0.62)));

  const titleLines = wrapTitle(title, 30, 3);
  const lineHeight = 70;
  const lastBaseline = H - 84;
  const firstBaseline = lastBaseline - (titleLines.length - 1) * lineHeight;
  const barY = firstBaseline - 92;
  const titleSvg = titleLines
    .map(
      (line, i) =>
        `<text x="72" y="${firstBaseline + i * lineHeight}" font-family="Inter, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="58" font-weight="800" letter-spacing="-1" fill="#f4f6f8">${esc(line)}</text>`,
    )
    .join("");
  const chipW = label.length * 13 + 44;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><radialGradient id="g" cx="${glowX}" cy="${glowY}" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${accent}" stop-opacity="0.28"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient><radialGradient id="g2" cx="140" cy="650" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2dd4bf" stop-opacity="0.14"/><stop offset="1" stop-color="#2dd4bf" stop-opacity="0"/></radialGradient><pattern id="d" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="${accent}" fill-opacity="0.22"/></pattern></defs><rect width="${W}" height="${H}" fill="#0b0f14"/><rect width="${W}" height="${H}" fill="url(#d)"/><rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#g2)"/><text x="${W - 60}" y="420" text-anchor="end" font-family="'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace" font-size="${motifSize}" font-weight="700" fill="none" stroke="${accent}" stroke-opacity="0.38" stroke-width="2.5">${esc(motif)}</text><rect x="72" y="72" width="${chipW}" height="40" rx="20" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-opacity="0.5"/><text x="94" y="99" font-family="'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace" font-size="20" letter-spacing="2" fill="${accent}">${esc(label)}</text><rect x="72" y="${barY}" width="96" height="8" rx="4" fill="${accent}"/>${titleSvg}</svg>`;
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
