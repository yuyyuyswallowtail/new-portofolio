import "server-only";

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image"; // "Nano Banana"
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function requireApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Put a real key from https://aistudio.google.com/app/apikey in .env",
    );
  }
  return key;
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

/**
 * Generates a full article (title/excerpt/tags/markdown body) about a random
 * tech topic (AI, web dev, or networking) using Gemini 2.5 Flash, asked to
 * return strict JSON so we can parse it without a fragile regex.
 */
export async function generateArticle(
  topicHint?: string,
): Promise<GeneratedArticle> {
  const key = requireApiKey();
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

  const res = await fetch(`${API_BASE}/${TEXT_MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Gemini text generation failed: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text content");

  const parsed = JSON.parse(text) as GeneratedArticle;
  if (!parsed.title || !parsed.contentMd) {
    throw new Error("Gemini response was missing required fields");
  }
  return parsed;
}

/**
 * Generates a cover image with Gemini 2.5 Flash Image ("Nano Banana") and
 * returns it as a data: URL so the MVP doesn't need an object-storage bucket
 * configured out of the box. Swap this for an upload to Supabase Storage / S3
 * once you wire that up (see PRD.md §6 open questions).
 */
export async function generateCoverImage(prompt: string): Promise<string> {
  const key = requireApiKey();

  const res = await fetch(`${API_BASE}/${IMAGE_MODEL}:generateContent`, {
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
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Gemini image generation failed: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(
    (p: { inlineData?: { data?: string } }) => p?.inlineData?.data,
  );
  if (!imagePart) {
    throw new Error(
      "Gemini did not return image data — check model access / free-tier quota",
    );
  }
  const mime = imagePart.inlineData.mimeType || "image/png";
  return `data:${mime};base64,${imagePart.inlineData.data}`;
}
