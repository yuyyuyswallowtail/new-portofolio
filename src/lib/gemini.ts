import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArticleJson } from "@/lib/json-repair";

const PRIMARY_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash";
// Model yang bukan untuk generate teks JSON (TTS, image, embedding, dst).
const NON_TEXT_MODEL = /(tts|image|imagen|embedding|audio|live|veo)/i;
// Model cadangan, dipisah koma. Dicoba berurutan kalau model utama 503/429.
const TEXT_MODELS = Array.from(
  new Set(
    [
      PRIMARY_TEXT_MODEL,
      ...(process.env.GEMINI_TEXT_FALLBACK_MODELS ?? "")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
    ].filter((m) => !NON_TEXT_MODEL.test(m)),
  ),
);
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "articles");
const IMAGE_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function requireApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Put a real key from https://aistudio.google.com/app/apikey in .env",
    );
  }
  return key;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry HANYA untuk 503 (overload sementara di sisi Google), dengan
 * exponential backoff. 429 sengaja tidak di-retry: limit per menit butuh
 * ~60 detik untuk reset dan limit harian tidak reset sampai besok, jadi
 * retry cepat hanya membuang kuota. Status lain (400, 401, 404, ...)
 * adalah masalah nyata dan langsung dikembalikan.
 */
async function fetchGeminiWithRetry(
  url: string,
  init: RequestInit,
  {
    retries = 3,
    baseDelayMs = 2000,
  }: { retries?: number; baseDelayMs?: number } = {},
): Promise<Response> {
  let res = await fetch(url, init);
  for (let attempt = 0; attempt < retries && res.status === 503; attempt++) {
    await res.text().catch(() => undefined);
    await sleep(baseDelayMs * 2 ** attempt);
    res = await fetch(url, init);
  }
  return res;
}

export type GeneratedArticle = {
  title: string;
  excerpt: string;
  tags: string[];
  contentMd: string;
};

const ARTICLE_TOPICS = [
  "artificial intelligence / machine learning",
  "web development (frontend or backend)",
  "computer networking",
] as const;

async function generateArticleJson(
  prompt: string,
  temperature: number,
  label: string,
): Promise<GeneratedArticle> {
  const key = requireApiKey();
  let lastError = "";

  if (TEXT_MODELS.length === 0) {
    throw new Error(`Gemini ${label} failed: no valid text model configured`);
  }

  for (const model of TEXT_MODELS) {
    const res = await fetchGeminiWithRetry(
      `${API_BASE}/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature,
          },
        }),
      },
      { retries: TEXT_MODELS.length > 1 ? 1 : 3 },
    );

    if (res.ok) {
      const data = await res.json();
      const text: string | undefined =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned no text content");

      const parsed = parseArticleJson<GeneratedArticle>(text);
      if (!parsed.title || !parsed.contentMd) {
        throw new Error("Gemini response was missing required fields");
      }
      return parsed;
    }

    const body = await res.text();
    lastError = `[${model}] ${res.status} ${body}`;
    // Overload/kuota, atau model yang tidak mendukung JSON mode: coba cadangan.
    const unsupportedModel =
      res.status === 400 && /JSON mode|not enabled|not supported/i.test(body);
    if (res.status !== 503 && res.status !== 429 && !unsupportedModel) break;
  }

  throw new Error(`Gemini ${label} failed: ${lastError}`);
}

export async function generateArticle(
  topicHint?: string,
): Promise<GeneratedArticle> {
  const topic =
    topicHint?.trim() ||
    ARTICLE_TOPICS[Math.floor(Math.random() * ARTICLE_TOPICS.length)];

  const prompt = `You are a senior software engineer writing a technical blog post for a
developer portfolio. Write an original, accurate, practical article about: ${topic}.

Respond with ONLY valid JSON (no markdown fences, no commentary) matching exactly:
{
  "title": string,
  "excerpt": string (max 200 chars, one sentence summary),
  "tags": string[] (3-5 short lowercase tags),
  "contentMd": string (800-1400 words, valid Markdown, with headings, at least
    one code block if relevant, no images/links to fake sources, no invented
    statistics presented as fact)
}`;

  return generateArticleJson(prompt, 0.8, "text generation");
}

export async function regenerateArticle(
  original: { title: string; contentMd: string },
  feedback: string,
): Promise<GeneratedArticle> {
  const prompt = `You previously wrote this draft article:

TITLE: ${original.title}

CONTENT:
${original.contentMd}

A human reviewer gave this feedback on what to improve:
"${feedback}"

Rewrite the article addressing that feedback. Respond with ONLY valid JSON (no
markdown fences, no commentary) matching exactly:
{
  "title": string,
  "excerpt": string (max 200 chars),
  "tags": string[] (3-5 short lowercase tags),
  "contentMd": string (valid Markdown, 800-1400 words unless the feedback asks
    for a different length)
}`;

  return generateArticleJson(prompt, 0.7, "regenerate");
}

/**
 * Generate cover image, simpan ke public/uploads/articles, dan kembalikan
 * URL-nya (/uploads/articles/xxx.png) — bukan data URL — supaya kolom
 * cover_image_url tetap kecil dan konsisten dengan upload manual.
 */
export async function generateCoverImage(prompt: string): Promise<string> {
  const key = requireApiKey();

  const res = await fetchGeminiWithRetry(
    `${API_BASE}/${IMAGE_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `A clean, modern, minimal technical illustration / cover image for a blog
article about: ${prompt}. Flat design, no text or letters in the image, dark
background with a single teal accent color, 16:9 aspect ratio.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: "16:9" },
        },
      }),
    },
  );

  if (!res.ok) {
    throw new Error(
      `Gemini image generation failed [${IMAGE_MODEL}]: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(
    (p: { inlineData?: { data?: string } }) => p?.inlineData?.data,
  );
  if (!imagePart) {
    throw new Error(
      `Gemini [${IMAGE_MODEL}] did not return image data — check model name / access / free-tier quota`,
    );
  }

  const mime: string = imagePart.inlineData.mimeType || "image/png";
  const ext = IMAGE_EXT[mime] ?? "png";
  const filename = `${randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(
    path.join(UPLOAD_DIR, filename),
    Buffer.from(imagePart.inlineData.data, "base64"),
  );
  return `/uploads/articles/${filename}`;
}

export function getTextModels(): string[] {
  return TEXT_MODELS;
}

export function getImageModel(): string {
  return IMAGE_MODEL;
}

/** Panggilan teks biasa (bukan JSON) untuk menulis prompt visual. null kalau gagal. */
export async function generateVisualPrompt(
  instruction: string,
): Promise<string | null> {
  const key = requireApiKey();
  for (const model of TEXT_MODELS) {
    const res = await fetchGeminiWithRetry(
      `${API_BASE}/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: instruction }] }],
          generationConfig: { temperature: 0.7 },
        }),
      },
      { retries: 1 },
    );
    if (res.ok) {
      const data = await res.json();
      const text: string | undefined =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? text.replace(/\s+/g, " ").trim().slice(0, 500) : null;
    }
    await res.text().catch(() => undefined);
    if (res.status !== 503 && res.status !== 429) break;
  }
  return null;
}

/** Panggilan teks yang mengembalikan JSON terstruktur (untuk klasifikasi). null kalau gagal. */
export async function classifyJson<T>(instruction: string): Promise<T | null> {
  const key = requireApiKey();
  for (const model of TEXT_MODELS) {
    const res = await fetchGeminiWithRetry(
      `${API_BASE}/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: instruction }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0,
          },
        }),
      },
      { retries: 1 },
    );
    if (res.ok) {
      const data = await res.json();
      const text: string | undefined =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;
      try {
        return parseArticleJson<T>(text);
      } catch {
        return null;
      }
    }
    await res.text().catch(() => undefined);
    if (res.status !== 503 && res.status !== 429) break;
  }
  return null;
}
