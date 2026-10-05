import "server-only";
import { generateFallbackCover } from "@/lib/fallback-cover";
import { generateCoverImage, generateVisualPrompt } from "@/lib/gemini";
import { logger } from "@/lib/logger";
import { generatePollinationsImage } from "@/lib/pollinations";

type ArticleLike = {
  title: string;
  excerpt: string;
  tags: string[];
  contentMd: string;
};

const STYLES = [
  "isometric flat vector illustration",
  "bold flat vector illustration with chunky shapes",
  "clean line-art illustration with a few solid color fills",
  "layered paper-cut illustration",
  "low-poly 3D render",
  "minimal geometric poster illustration",
];
const PALETTE =
  "dark background, teal as the accent color, no text, no letters, no logos, no people";
const SKIP_HEADING = /(conclusion|kesimpulan|summary|penutup|references)/i;
const MAX_SECTION_IMAGES = 2;

// ---------- Anggaran waktu (serverless: function dibatasi maxDuration) ----------
// Total waktu default untuk semua gambar. Pemanggil bisa menimpa lewat options.budgetMs.
const DEFAULT_BUDGET_MS = 80_000;
// Gemini gambar dibatasi supaya Pollinations masih sempat dicoba.
const GEMINI_IMAGE_MAX_MS = 25_000;
// Waktu maksimum untuk cover (setelah itu jatuh ke SVG lokal).
const COVER_MAX_MS = 45_000;
// Jangan mulai satu percobaan kalau sisa waktunya lebih kecil dari ini.
const MIN_ATTEMPT_MS = 8_000;
// Gambar section hanya dicoba kalau sisa waktu minimal sebesar ini.
const MIN_SECTION_MS = 20_000;
// Di bawah ini langsung pakai cover SVG lokal tanpa memanggil API.
const MIN_TOTAL_MS = 12_000;

/** Menolak (reject) kalau p belum selesai dalam ms milidetik. */
function withinMs<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timeout setelah ${Math.round(ms)}ms`)),
      Math.max(ms, 1),
    );
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickStyle(a: ArticleLike): string {
  return (
    STYLES[hashString(a.title) % STYLES.length] ?? "flat vector illustration"
  );
}

function stripCode(md: string): string {
  return md.replace(/```[\s\S]*?```/g, " ");
}

/** Ringkasan isi artikel untuk prompt cover: heading + paragraf pembuka. */
function articleDigest(a: ArticleLike): string {
  const headings = a.contentMd
    .split("\n")
    .filter((l) => /^##\s+/.test(l))
    .map((l) => l.replace(/^##\s+/, "").trim())
    .join("; ");
  const intro = stripCode(a.contentMd)
    .replace(/^#.*$/gm, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
  return `Section headings: ${headings}\nIntro: ${intro}`;
}

/** Teks di bawah satu heading ## sampai heading berikutnya (tanpa blok kode). */
function getSectionText(lines: string[], headingIdx: number): string {
  const body: string[] = [];
  let inCode = false;
  for (let i = headingIdx + 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (/^##\s+/.test(line)) break;
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (!inCode) body.push(line);
  }
  return body.join(" ").replace(/\s+/g, " ").trim().slice(0, 700);
}

/**
 * Gemini membaca isi artikel dan menemukan SATU adegan konkret yang hanya
 * cocok dengan artikel itu, supaya hasilnya tidak seragam dan tidak literal.
 * Dibatasi timeoutMs; kalau gagal atau lambat, jatuh ke prompt dari tag.
 */
async function buildVisualPrompt(
  a: ArticleLike,
  style: string,
  section?: { heading: string; text: string },
  timeoutMs = 15_000,
): Promise<string> {
  const material = section
    ? `Section "${section.heading}" of the article "${a.title}". Section text: ${section.text}`
    : `Article "${a.title}". Summary: ${a.excerpt}\n${articleDigest(a)}`;

  const instruction = `You write prompts for an AI image generator. Read this technical article material and invent ONE specific, concrete visual scene that represents its main idea, so a reader could guess the topic from the picture.

${material}

Rules:
- Max 40 words. Describe only objects, composition, camera angle and lighting.
- Choose a subject that fits THIS article only. Think of the key idea (speed, safety, migration, caching, testing, upgrading, etc.) and show it as a physical scene.
- Good reasoning, do not copy: faster builds -> a rocket-shaped toolbox leaving speed trails; type system -> puzzle pieces snapping into a grid; memory leak fix -> a dripping pipe being sealed with a patch.
- Forbidden words and ideas: nodes, network, circuit, glowing orb, core, hub, particles, abstract pattern, house, building, city.
- No people, text, letters, logos, or brand names.
Output only the prompt.`;

  let described: string | null = null;
  try {
    described = await withinMs(
      generateVisualPrompt(instruction),
      timeoutMs,
      "visual prompt",
    );
  } catch (err) {
    logger.warn("article_visual_prompt_failed", {
      error: (err as Error).message.slice(0, 300),
    });
  }
  const base =
    described ??
    `a concrete symbolic scene about ${a.tags.slice(0, 3).join(", ")}`;
  return `${base}. ${style}, ${PALETTE}`;
}

/**
 * Gemini (kalau aktif) -> Pollinations (kalau aktif) -> null.
 * Tidak pernah throw, dan selesai paling lambat budgetMs.
 */
// Tier anonim Pollinations: 1 request per 15 detik. Beri jeda antar-request.
let lastPollinationsAt = 0;
async function pacePollinations(maxWaitMs: number): Promise<void> {
  const gap = lastPollinationsAt + 16_000 - Date.now();
  const wait = Math.min(Math.max(0, gap), Math.max(0, maxWaitMs));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastPollinationsAt = Date.now();
}

async function generateOne(
  prompt: string,
  budgetMs: number,
): Promise<string | null> {
  const started = Date.now();
  const left = () => budgetMs - (Date.now() - started);

  if (process.env.GEMINI_IMAGE_ENABLED !== "false" && left() > MIN_ATTEMPT_MS) {
    try {
      return await withinMs(
        generateCoverImage(prompt),
        Math.min(left(), GEMINI_IMAGE_MAX_MS),
        "gemini image",
      );
    } catch (err) {
      logger.warn("article_image_gemini_failed", {
        error: (err as Error).message.slice(0, 300),
      });
    }
  }
  if (
    process.env.POLLINATIONS_ENABLED !== "false" &&
    left() > MIN_ATTEMPT_MS
  ) {
    await pacePollinations(left() - MIN_ATTEMPT_MS - 20_000);
    try {
      return await withinMs(
        generatePollinationsImage(prompt, {
          timeoutMs: Math.min(left(), 40_000),
          attempts: 2,
        }),
        left(),
        "pollinations",
      );
    } catch (err) {
      logger.warn("article_image_pollinations_failed", {
        error: (err as Error).message.slice(0, 300),
      });
    }
  }
  return null;
}

/**
 * Gambar di isi artikel (maks MAX_SECTION_IMAGES). Berhenti begitu waktu habis
 * dan mengembalikan apa yang sudah jadi, bukan membuang semuanya.
 */
async function addSectionImages(
  a: ArticleLike,
  style: string,
  deadline: number,
): Promise<{ contentMd: string; added: number }> {
  const lines = a.contentMd.split("\n");
  const candidates: number[] = [];
  lines.forEach((line, i) => {
    if (/^##\s+/.test(line) && !SKIP_HEADING.test(line)) candidates.push(i);
  });
  if (candidates.length === 0) return { contentMd: a.contentMd, added: 0 };

  const count = Math.min(MAX_SECTION_IMAGES, candidates.length);
  const picked = new Set<number>();
  for (let k = 0; k < count; k++) {
    const idx = Math.floor(((k + 1) * candidates.length) / (count + 1));
    const line = candidates[Math.min(idx, candidates.length - 1)];
    if (line !== undefined) picked.add(line);
  }

  const inserts = new Map<number, string>();
  for (const lineIdx of picked) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_SECTION_MS) break;

    const heading = (lines[lineIdx] ?? "").replace(/^##\s+/, "").trim();
    const text = getSectionText(lines, lineIdx);
    const prompt = await buildVisualPrompt(
      a,
      style,
      { heading, text },
      Math.min(15_000, remaining / 3),
    );
    const url = await generateOne(prompt, deadline - Date.now());
    if (url) {
      inserts.set(lineIdx, `\n![${heading.replace(/[[\]]/g, "")}](${url})\n`);
    }
  }

  const contentMd = lines
    .map((line, i) => (inserts.has(i) ? `${line}\n${inserts.get(i)}` : line))
    .join("\n");
  return { contentMd, added: inserts.size };
}

/**
 * Cover kontekstual + gambar di isi artikel. Tidak pernah throw dan selalu
 * mengembalikan cover (SVG lokal kalau generator gagal atau waktu habis).
 * Selesai dalam options.budgetMs (default DEFAULT_BUDGET_MS).
 */
export async function generateArticleImages(
  a: ArticleLike,
  options: { budgetMs?: number } = {},
): Promise<{ coverImageUrl: string; contentMd: string }> {
  const startedAt = Date.now();
  const deadline = startedAt + (options.budgetMs ?? DEFAULT_BUDGET_MS);
  const left = () => deadline - Date.now();

  if (left() < MIN_TOTAL_MS) {
    logger.warn("article_images_skipped", { budgetMs: left() });
    return {
      coverImageUrl: generateFallbackCover(a.title),
      contentMd: a.contentMd,
    };
  }

  const style = pickStyle(a);
  const coverPrompt = await buildVisualPrompt(
    a,
    style,
    undefined,
    Math.min(15_000, Math.max(left() - MIN_ATTEMPT_MS, 3_000)),
  );
  const cover =
    left() > MIN_ATTEMPT_MS
      ? await generateOne(coverPrompt, Math.min(left(), COVER_MAX_MS))
      : null;
  const coverImageUrl = cover ?? generateFallbackCover(a.title);

  let contentMd = a.contentMd;
  let sectionImages = 0;
  if (left() >= MIN_SECTION_MS) {
    try {
      const res = await addSectionImages(a, style, deadline);
      contentMd = res.contentMd;
      sectionImages = res.added;
    } catch (err) {
      logger.warn("article_section_images_failed", {
        error: (err as Error).message.slice(0, 300),
      });
    }
  }

  logger.info("article_images_done", {
    coverGenerated: Boolean(cover),
    sectionImages,
    elapsedMs: Date.now() - startedAt,
  });
  return { coverImageUrl, contentMd };
}
