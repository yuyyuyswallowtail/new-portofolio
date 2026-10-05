import { can } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";
import { getOwnerProfile, listEducation } from "@/modules/content/repository";
import { EducationManager } from "./manager";

export default async function DashboardEducationPage() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "content.manage")) {
    return (
      <p className="text-sm text-ink-muted">
        Kamu tidak punya izin mengelola konten.
      </p>
    );
  }
  const owner = await getOwnerProfile();
  if (!owner) {
    return (
      <p className="text-sm text-ink-muted">
        Profil owner belum ada — jalankan seed:admin dulu.
      </p>
    );
  }

  const rows = await listEducation(owner.id);
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Education</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Tampil di section Education di halaman public. Urutan mengikuti tombol
        panah (atas = paling atas). Gambar institusi otomatis diperkecil ke
        maksimal 640px dan langsung tersimpan setelah diunggah.
      </p>
      <EducationManager
        items={rows.map((e) => ({
          id: e.id,
          institution: e.institution,
          degree: e.degree,
          gpa: e.gpa,
          startDate: e.startDate,
          endDate: e.endDate,
          notes: e.notes,
          imageUrl: e.imageUrl,
        }))}
      />
    </div>
  );
}
