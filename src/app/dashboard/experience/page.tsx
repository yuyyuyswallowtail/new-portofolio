import { getContentOwner } from "@/modules/content/access";
import { listExperiences } from "@/modules/content/repository";
import { ExperienceManager } from "./manager";

export default async function DashboardExperiencePage() {
  const access = await getContentOwner();
  if (!access.ok) {
    return <p className="text-sm text-ink-muted">{access.message}</p>;
  }
  const rows = await listExperiences(access.owner.id);
  // Beranda mengurutkan berdasarkan tanggal mulai (terbaru di atas).
  const sorted = [...rows].sort((a, b) =>
    (b.startDate ?? "").localeCompare(a.startDate ?? ""),
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Experience &amp; training</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Tampil di section Experience &amp; training. Urutan otomatis mengikuti
        tanggal mulai (terbaru di atas).
      </p>
      <ExperienceManager
        items={sorted.map((e) => ({
          id: e.id,
          title: e.title,
          organization: e.organization,
          type: e.type,
          startDate: e.startDate,
          endDate: e.endDate,
          description: e.description,
        }))}
      />
    </div>
  );
}
