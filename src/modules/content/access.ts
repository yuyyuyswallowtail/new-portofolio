import "server-only";
import { can } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";
import { getOwnerProfile } from "./repository";

/** Dipakai halaman dashboard konten: cek izin + ambil owner portfolio. */
export async function getContentOwner() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "content.manage")) {
    return {
      ok: false as const,
      message: "Kamu tidak punya izin mengelola konten.",
    };
  }
  const owner = await getOwnerProfile();
  if (!owner) {
    return {
      ok: false as const,
      message: "Profil owner belum ada — jalankan seed:admin dulu.",
    };
  }
  return { ok: true as const, owner };
}
