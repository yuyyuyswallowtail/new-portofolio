import "server-only";
import { saveArticleImage } from "@/lib/image-storage";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
// 402/429 = throttle tier anonim; 5xx = error sementara di sisi Pollinations.
const RETRYABLE = new Set([402, 429, 500, 502, 503, 504]);
// Percobaan terakhir tanpa parameter model (pakai default yang sedang sehat).
const MODELS: (string | undefined)[] = ["flux", "flux", undefined, undefined];
// Tier anonim: 1 request per ~15 detik. Dikasih margin 1 detik.
const MIN_GAP_MS = 16_000;

let lastRequestAt = 0;
let chain: Promise<void> = Promise.resolve();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Antrean global: semua request Pollinations berjarak minimal MIN_GAP_MS. */
function throttle(): Promise<void> {
  const next = chain.then(async () => {
    const wait = lastRequestAt + MIN_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
  });
  chain = next.catch(() => undefined);
  return next;
}

/** Generate gambar gratis via Pollinations, simpan lewat saveArticleImage. */
export async function generatePollinationsImage(
  prompt: string,
  {
    width = 1280,
    height = 720,
    timeoutMs = 60_000,
    attempts = MODELS.length,
  }: {
    width?: number;
    height?: number;
    timeoutMs?: number;
    attempts?: number;
  } = {},
): Promise<string> {
  let lastError = "";

  for (let i = 0; i < attempts; i++) {
    const model = MODELS[i % MODELS.length];
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 600))}?width=${width}&height=${height}&nologo=true${model ? `&model=${model}` : ""}&seed=${Math.floor(Math.random() * 1e6)}`;

    await throttle();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) {
        const mime =
          (res.headers.get("content-type") ?? "").split(";")[0]?.trim() ?? "";
        const ext = EXT[mime];
        if (!ext) {
          lastError = `non-image content-type: ${mime}`;
        } else {
          const buffer = Buffer.from(await res.arrayBuffer());
          if (buffer.length >= 5_000) {
            return await saveArticleImage(buffer, ext, mime);
          }
          lastError = "image too small";
        }
      } else {
        lastError = `${res.status} ${(await res.text()).slice(0, 200)}`;
        if (!RETRYABLE.has(res.status)) break;
        if (res.status >= 500) await sleep(15_000);
      }
    } catch (err) {
      lastError = (err as Error).message; // timeout / jaringan / penyimpanan: coba lagi
    }
  }

  throw new Error(`Pollinations failed after retries: ${lastError}`);
}

export function generatePollinationsCover(title: string): Promise<string> {
  return generatePollinationsImage(
    `Minimal flat technical illustration for a blog article about: ${title}. Dark background, single teal accent color, no text, no letters`,
  );
}
