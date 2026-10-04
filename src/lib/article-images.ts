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
 */
async function buildVisualPrompt(
  a: ArticleLike,
  style: string,
  section?: { heading: string; text: string },
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
    described = await generateVisualPrompt(instruction);
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

/** Gemini (kalau aktif) -> Pollinations (kalau aktif) -> null. */
async function generateOne(
  prompt: string,
  timeoutMs: number,
): Promise<string | null> {
  if (process.env.GEMINI_IMAGE_ENABLED !== "false") {
    try {
      return await generateCoverImage(prompt);
    } catch (err) {
      logger.warn("article_image_gemini_failed", {
        error: (err as Error).message.slice(0, 300),
      });
    }
  }
  if (process.env.POLLINATIONS_ENABLED !== "false") {
    try {
      return await generatePollinationsImage(prompt, { timeoutMs });
    } catch (err) {
      logger.warn("article_image_pollinations_failed", {
        error: (err as Error).message.slice(0, 300),
      });
    }
  }
  return null;
}

async function addSectionImages(
  a: ArticleLike,
  style: string,
): Promise<string> {
  const lines = a.contentMd.split("\n");
  const candidates: number[] = [];
  lines.forEach((line, i) => {
    if (/^##\s+/.test(line) && !SKIP_HEADING.test(line)) candidates.push(i);
  });
  if (candidates.length === 0) return a.contentMd;

  const count = Math.min(MAX_SECTION_IMAGES, candidates.length);
  const picked = new Set<number>();
  for (let k = 0; k < count; k++) {
    const idx = Math.floor(((k + 1) * candidates.length) / (count + 1));
    const line = candidates[Math.min(idx, candidates.length - 1)];
    if (line !== undefined) picked.add(line);
  }

  const inserts = new Map<number, string>();
  for (const lineIdx of picked) {
    const heading = (lines[lineIdx] ?? "").replace(/^##\s+/, "").trim();
    const text = getSectionText(lines, lineIdx);
    const prompt = await buildVisualPrompt(a, style, { heading, text });
    const url = await generateOne(prompt, 60_000);
    if (url)
      inserts.set(lineIdx, `\n![${heading.replace(/[[\]]/g, "")}](${url})\n`);
  }

  return lines
    .map((line, i) => (inserts.has(i) ? `${line}\n${inserts.get(i)}` : line))
    .join("\n");
}

/** Cover kontekstual + gambar di isi artikel. Tidak pernah throw. */
export async function generateArticleImages(
  a: ArticleLike,
): Promise<{ coverImageUrl: string; contentMd: string }> {
  const style = pickStyle(a);
  const coverPrompt = await buildVisualPrompt(a, style);
  const cover = await generateOne(coverPrompt, 60_000);
  const coverImageUrl = cover ?? generateFallbackCover(a.title);

  let contentMd = a.contentMd;
  try {
    contentMd = await addSectionImages(a, style);
  } catch (err) {
    logger.warn("article_section_images_failed", {
      error: (err as Error).message.slice(0, 300),
    });
  }
  return { coverImageUrl, contentMd };
}
