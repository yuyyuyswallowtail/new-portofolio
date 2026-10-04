import { getContentOwner } from "@/modules/content/access";
import { listCertifications } from "@/modules/content/repository";
import { CertificationManager } from "./manager";

export default async function DashboardCertificationsPage() {
  const access = await getContentOwner();
  if (!access.ok) {
    return <p className="text-sm text-ink-muted">{access.message}</p>;
  }
  const rows = await listCertifications(access.owner.id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Certifications</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Tampil sebagai grid di section Certifications. Urutan mengikuti tombol
        panah (atas = paling awal di grid).
      </p>
      <CertificationManager
        items={rows.map((c) => ({
          id: c.id,
          title: c.title,
          issuer: c.issuer,
          imageUrl: c.imageUrl,
          verifyUrl: c.verifyUrl,
          issuedAt: c.issuedAt,
        }))}
      />
    </div>
  );
}
