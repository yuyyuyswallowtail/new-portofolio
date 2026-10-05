"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { can } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";
import { getOwnerProfile, listEducation, updateEducation } from "./repository";

const idSchema = z.string().uuid();
const imageUrlSchema = z
  .string()
  .max(500)
  .refine(
    (v) => (v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\//.test(v),
    "URL gambar tidak valid",
  )
  .nullable();

/** Pasang atau hapus (null) gambar satu data pendidikan. Dipanggil langsung setelah upload. */
export async function setEducationImageAction(
  id: string,
  imageUrl: string | null,
): Promise<{ ok: true; data: null } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "content.manage")) {
    return { ok: false, error: "Kamu tidak punya izin mengelola konten." };
  }
  if (!idSchema.safeParse(id).success) {
    return { ok: false, error: "Input tidak valid." };
  }
  const parsed = imageUrlSchema.safeParse(imageUrl);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
    };
  }

  const owner = await getOwnerProfile();
  if (!owner) return { ok: false, error: "Profil owner tidak ditemukan." };
  const rows = await listEducation(owner.id);
  if (!rows.some((r) => r.id === id)) {
    return { ok: false, error: "Data tidak ditemukan." };
  }

  const row = await updateEducation(id, { imageUrl: parsed.data });
  if (!row) return { ok: false, error: "Data tidak ditemukan." };

  logger.info("education_image_updated", { educationId: id, userId: user.id });
  revalidatePath("/dashboard/education");
  revalidatePath("/");
  return { ok: true, data: null };
}
