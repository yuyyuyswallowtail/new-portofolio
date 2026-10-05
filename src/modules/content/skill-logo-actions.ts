"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { can } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";
import { getOwnerProfile, listSkills, updateSkill } from "./repository";

const idSchema = z.string().uuid();
const logoUrlSchema = z
  .string()
  .max(500)
  .refine(
    (v) => (v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\//.test(v),
    "URL logo tidak valid",
  )
  .nullable();

/** Pasang atau hapus (null) logo satu skill. Dipanggil langsung setelah upload. */
export async function setSkillLogoAction(
  id: string,
  logoUrl: string | null,
): Promise<{ ok: true; data: null } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "content.manage")) {
    return { ok: false, error: "Kamu tidak punya izin mengelola konten." };
  }
  if (!idSchema.safeParse(id).success) {
    return { ok: false, error: "Input tidak valid." };
  }
  const parsed = logoUrlSchema.safeParse(logoUrl);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
    };
  }

  const owner = await getOwnerProfile();
  if (!owner) return { ok: false, error: "Profil owner tidak ditemukan." };
  const rows = await listSkills(owner.id);
  if (!rows.some((r) => r.id === id)) {
    return { ok: false, error: "Data tidak ditemukan." };
  }

  const row = await updateSkill(id, { logoUrl: parsed.data });
  if (!row) return { ok: false, error: "Data tidak ditemukan." };

  logger.info("skill_logo_updated", { skillId: id, userId: user.id });
  revalidatePath("/dashboard/skills");
  revalidatePath("/");
  return { ok: true, data: null };
}
