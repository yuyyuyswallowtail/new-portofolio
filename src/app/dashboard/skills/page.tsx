import { getContentOwner } from "@/modules/content/access";
import { listSkills } from "@/modules/content/repository";
import { SkillManager } from "./manager";

export default async function DashboardSkillsPage() {
  const access = await getContentOwner();
  if (!access.ok) {
    return <p className="text-sm text-ink-muted">{access.message}</p>;
  }
  const rows = await listSkills(access.owner.id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Skills</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Di halaman public skill dikelompokkan per kategori. Urutan hanya
        berpengaruh di antara skill dengan kategori yang sama. Logo (PNG)
        otomatis diperkecil ke maksimal 128px dan tampil di tumpukan sticker
        di bawah daftar skill.
      </p>
      <SkillManager
        items={rows.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          logoUrl: s.logoUrl,
        }))}
      />
    </div>
  );
}
