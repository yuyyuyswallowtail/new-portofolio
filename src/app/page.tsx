import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  getOwnerProfile,
  listCertifications,
  listEducation,
  listExperiences,
  listProjects,
  listSkills,
} from "@/modules/content/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const owner = await getOwnerProfile();

  if (!owner) {
    return (
      <>
        <SiteNav />
        <main className="mx-auto max-w-5xl px-6 py-24">
          <h1 className="text-2xl font-semibold">Belum ada profil</h1>
          <p className="mt-2 text-ink-muted">
            Jalankan <code className="font-data">bun run seed:admin</code> lalu
            lengkapi profil dari dashboard.
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const [education, experiences, certifications, skills, projects] =
    await Promise.all([
      listEducation(owner.id),
      listExperiences(owner.id),
      listCertifications(owner.id),
      listSkills(owner.id),
      listProjects(owner.id),
    ]);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="py-20">
          <p className="font-data text-sm text-accent">available for work</p>
          <h1 className="mt-2 text-5xl font-semibold tracking-tight">
            {owner.name ?? "Yuyyuy"}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-ink-muted">
            {owner.bio ??
              "Backend & local-inference engineer — RBAC, layered services, and running LLMs on constrained hardware."}
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="#projects"
              className={buttonVariants({ variant: "primary" })}
            >
              View projects
            </Link>
            {owner.cvUrl && (
              <a
                href={owner.cvUrl}
                className={buttonVariants({ variant: "outline" })}
              >
                Download CV
              </a>
            )}
          </div>
        </section>

        {/* About */}
        <section className="grid grid-cols-1 gap-8 border-t border-line py-14 md:grid-cols-[1fr_260px]">
          <div>
            <h2 className="text-2xl font-semibold">About</h2>
            <p className="mt-3 max-w-[72ch] leading-relaxed text-ink-muted">
              {owner.bio}
            </p>
          </div>
          <div className="font-data space-y-2 text-sm text-ink-muted">
            {owner.domicile && <p>domicile: {owner.domicile}</p>}
            {owner.linkedinUrl && (
              <p>
                linkedin:{" "}
                <a href={owner.linkedinUrl} className="text-accent">
                  ↗
                </a>
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {Array.from(
                new Set([
                  ...(owner.skills ?? []),
                  ...skills.map((s) => s.name),
                ]),
              ).map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Education & Experience */}
        <section className="border-t border-line py-14">
          <h2 className="text-2xl font-semibold">Education &amp; experience</h2>
          <div className="mt-6 space-y-4">
            {[
              ...experiences,
              ...education.map((e) => ({
                ...e,
                title: e.degree ?? e.institution,
                organization: e.institution,
                type: "education" as const,
              })),
            ]
              .sort((a, b) =>
                (b.startDate ?? "").localeCompare(a.startDate ?? ""),
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-baseline justify-between border-b border-line pb-3"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-ink-muted">
                      {item.organization}
                    </p>
                  </div>
                  <p className="font-data whitespace-nowrap text-xs text-ink-muted">
                    {formatDate(item.startDate)} —{" "}
                    {item.endDate ? formatDate(item.endDate) : "now"}
                  </p>
                </div>
              ))}
            {experiences.length === 0 && education.length === 0 && (
              <p className="text-sm text-ink-muted">
                Belum ada data — isi dari dashboard.
              </p>
            )}
          </div>
        </section>

        {/* Certifications */}
        {certifications.length > 0 && (
          <section className="border-t border-line py-14">
            <h2 className="text-2xl font-semibold">Certifications</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {certifications.map((c) => (
                <Card key={c.id}>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-ink-muted">{c.issuer}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        <section id="projects" className="border-t border-line py-14">
          <h2 className="text-2xl font-semibold">Projects</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {projects.map((p) => (
              <Card key={p.id}>
                <div className="flex items-center justify-between">
                  <p className="font-medium">{p.title}</p>
                  <Badge tone={p.source === "github" ? "accent" : "default"}>
                    {p.source}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-ink-muted">{p.description}</p>
                <div className="mt-3 flex gap-3 font-data text-xs text-accent">
                  {p.repoUrl && <a href={p.repoUrl}>repo ↗</a>}
                  {p.liveUrl && <a href={p.liveUrl}>live ↗</a>}
                </div>
              </Card>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-ink-muted">
                Belum ada project — isi dari dashboard.
              </p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
