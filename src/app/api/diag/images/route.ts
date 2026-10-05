import { NextResponse } from "next/server";

/**
 * SEMENTARA: uji provider gambar dari runtime Vercel. Dilindungi header
 * x-cron-secret (sama dengan CRON_SECRET). Hapus route ini setelah selesai.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// PNG 1x1 untuk uji upload ke Storage.
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

type Probe = { name: string; ok: boolean; ms: number; detail: string };

async function probe(name: string, fn: () => Promise<string>): Promise<Probe> {
  const t = Date.now();
  try {
    const detail = await fn();
    return { name, ok: true, ms: Date.now() - t, detail };
  } catch (err) {
    return {
      name,
      ok: false,
      ms: Date.now() - t,
      detail: (err as Error).message.slice(0, 500),
    };
  }
}

function geminiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY kosong");
  return key;
}

async function geminiModels(): Promise<string> {
  const res = await fetch(`${API_BASE}?pageSize=200`, {
    headers: { "x-goog-api-key": geminiKey() },
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 300)}`);
  const data = JSON.parse(text) as { models?: { name: string }[] };
  const names = (data.models ?? [])
    .map((m) => m.name.replace("models/", ""))
    .filter((n) => /image|imagen/i.test(n));
  return names.length > 0
    ? names.join(", ")
    : "tidak ada model image di daftar untuk key ini";
}

async function geminiImage(): Promise<string> {
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";
  const res = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": geminiKey(),
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: "A simple flat illustration of a red apple, dark background" },
          ],
        },
      ],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
    signal: AbortSignal.timeout(40_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`[${model}] ${res.status} ${text.slice(0, 300)}`);
  if (!text.includes('"inlineData"')) {
    throw new Error(`[${model}] 200 tapi tanpa data gambar`);
  }
  return `[${model}] ok, respons ${Math.round(text.length / 1024)}KB`;
}

async function pollinations(): Promise<string> {
  const prompt = encodeURIComponent(
    "a red apple on a wooden table, flat illustration",
  );
  const url = `https://image.pollinations.ai/prompt/${prompt}?width=256&height=144&nologo=true&seed=${Date.now() % 1000}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    throw new Error(`${res.status} ${(await res.text()).slice(0, 250)}`);
  }
  if (!type.startsWith("image/")) {
    throw new Error(`bukan gambar: ${type} ${(await res.text()).slice(0, 200)}`);
  }
  const bytes = (await res.arrayBuffer()).byteLength;
  return `ok ${type}, ${bytes} B`;
}

async function storage(): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("env Supabase kosong");
  const base = url.replace(/\/$/, "");
  const bucket = process.env.SUPABASE_BUCKET ?? "uploads";
  const objectPath = `articles/diag-${Date.now()}.png`;
  const headers = { Authorization: `Bearer ${key}`, apikey: key };

  const up = await fetch(`${base}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "image/png" },
    body: new Uint8Array(TINY_PNG),
    signal: AbortSignal.timeout(20_000),
  });
  if (!up.ok) {
    throw new Error(`upload ${up.status} ${(await up.text()).slice(0, 200)}`);
  }
  await fetch(`${base}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "DELETE",
    headers,
    signal: AbortSignal.timeout(15_000),
  }).catch(() => undefined);
  return `upload ok (bucket ${bucket}), file uji dihapus`;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const env = {
    region: process.env.VERCEL_REGION ?? "(lokal)",
    GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
    GEMINI_IMAGE_ENABLED: process.env.GEMINI_IMAGE_ENABLED ?? "(kosong)",
    GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL ?? "(kosong)",
    POLLINATIONS_ENABLED: process.env.POLLINATIONS_ENABLED ?? "(kosong)",
    SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  const probes = await Promise.all([
    probe("gemini_models_image", geminiModels),
    probe("gemini_image_generate", geminiImage),
    probe("pollinations", pollinations),
    probe("supabase_storage", storage),
  ]);

  return NextResponse.json({ env, probes });
}
