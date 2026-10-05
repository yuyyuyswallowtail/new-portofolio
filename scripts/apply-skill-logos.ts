import "dotenv/config";
import { access } from "node:fs/promises";
import path from "node:path";
import { and, eq, isNull, like, or } from "drizzle-orm";
import { db } from "../src/db/client";
import { skillEntries } from "../src/db/schema";
import { LOGOS } from "./skill-logos";

/**
 * Mengisi skill_entries.logo_url dengan /skills/<file>.png untuk skill yang
 * file logonya ada di public/skills (hasil scripts/fetch-skill-logos.ts).
 * Logo yang kamu upload sendiri lewat dashboard TIDAK ditimpa.
 * Aman dijalankan berkali-kali (juga setelah seed-content RESET=1).
 *
 *   bun run scripts/apply-skill-logos.ts
 */
async function exists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  let updated = 0;
  const noFile: string[] = [];
  const noMatch: string[] = [];

  for (const logo of LOGOS) {
    const file = path.join(
      process.cwd(),
      "public",
      "skills",
      `${logo.file}.png`,
    );
    if (!(await exists(file))) {
      noFile.push(logo.name);
      continue;
    }
    const rows = await db
      .update(skillEntries)
      .set({ logoUrl: `/skills/${logo.file}.png` })
      .where(
        and(
          eq(skillEntries.name, logo.name),
          isNull(skillEntries.deletedAt),
          or(
            isNull(skillEntries.logoUrl),
            like(skillEntries.logoUrl, "/skills/%"),
          ),
        ),
      )
      .returning({ id: skillEntries.id });
    if (rows.length === 0) noMatch.push(logo.name);
    else updated += rows.length;
  }

  console.log(`logo terpasang: ${updated}`);
  if (noFile.length > 0) {
    console.log(`file belum ada di public/skills: ${noFile.join(", ")}`);
  }
  if (noMatch.length > 0) {
    console.log(
      `tidak ada baris yang cocok (nama skill beda, atau sudah punya logo upload sendiri): ${noMatch.join(", ")}`,
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
