import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { LOGO_SIZE, LOGOS, type SkillLogo } from "./skill-logos";

/**
 * Mengunduh logo skill (SVG dari Devicon, cadangan Simple Icons), mengubahnya
 * menjadi PNG LOGO_SIZE x LOGO_SIZE dengan latar transparan, dan menyimpannya
 * di public/skills/<file>.png. Aman dijalankan ulang.
 *
 *   bun run scripts/fetch-skill-logos.ts
 */
const OUT_DIR = path.join(process.cwd(), "public", "skills");
const PAD = 8;
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

async function fetchSvg(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const text = await res.text();
    return text.includes("<svg") ? text : null;
  } catch {
    return null;
  }
}

function candidates(l: SkillLogo): { source: string; url: string }[] {
  const out: { source: string; url: string }[] = [];
  for (const slug of l.devicon) {
    for (const variant of ["original", "plain"]) {
      out.push({
        source: `devicon/${slug}-${variant}`,
        url: `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${slug}/${slug}-${variant}.svg`,
      });
    }
  }
  for (const slug of l.simple ?? []) {
    out.push({
      source: `simple-icons/${slug}`,
      url: `https://cdn.simpleicons.org/${slug}`,
    });
  }
  return out;
}

async function toPng(svg: string): Promise<Buffer> {
  const inner = LOGO_SIZE - PAD * 2;
  return sharp(Buffer.from(svg), { density: 384 })
    .resize(inner, inner, { fit: "contain", background: CLEAR })
    .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: CLEAR })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const missing: string[] = [];
  let totalBytes = 0;

  for (const logo of LOGOS) {
    let done = false;
    for (const c of candidates(logo)) {
      const svg = await fetchSvg(c.url);
      if (!svg) continue;
      try {
        const png = await toPng(svg);
        await writeFile(path.join(OUT_DIR, `${logo.file}.png`), png);
        totalBytes += png.length;
        console.log(
          `ok        ${logo.name.padEnd(14)} <- ${c.source} (${png.length} B)`,
        );
        done = true;
        break;
      } catch (err) {
        console.log(`  konversi gagal ${c.source}: ${(err as Error).message}`);
      }
    }
    if (!done) {
      missing.push(logo.name);
      console.log(`TIDAK ADA ${logo.name}`);
    }
  }

  console.log(
    `\n${LOGOS.length - missing.length}/${LOGOS.length} logo tersimpan di public/skills (${LOGO_SIZE}x${LOGO_SIZE}px, total ${(totalBytes / 1024).toFixed(1)} KB).`,
  );
  if (missing.length > 0) {
    console.log(`Belum ada: ${missing.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
