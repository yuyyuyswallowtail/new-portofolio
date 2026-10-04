import { getContentOwner } from "@/modules/content/access";
import { listProjects } from "@/modules/content/repository";
import { ProjectManager } from "./manager";

export default async function DashboardProjectsPage() {
  const access = await getContentOwner();
  if (!access.ok) {
    return <p className="text-sm text-ink-muted">{access.message}</p>;
  }
  const rows = await listProjects(access.owner.id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Tampil sebagai kartu di section Projects. Urutan mengikuti tombol panah.
        Project baru yang dibuat di sini bersumber &quot;manual&quot;.
      </p>
      <ProjectManager
        items={rows.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          repoUrl: p.repoUrl,
          liveUrl: p.liveUrl,
          imageUrl: p.imageUrl,
          source: p.source,
          featured: p.featured,
        }))}
      />
    </div>
  );
}
