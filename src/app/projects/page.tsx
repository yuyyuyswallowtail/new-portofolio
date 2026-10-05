import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { Stagger, StaggerItem } from "@/components/site/motion";
import { SiteNav } from "@/components/site/nav";
import { ProjectCard } from "@/components/site/project-card";
import { getOwnerProfile, listProjects } from "@/modules/content/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const owner = await getOwnerProfile();
  const projects = owner ? await listProjects(owner.id) : [];

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <p className="kicker">/ Work</p>
        <h1 className="display-lg mt-3">Projects</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-muted">
          Web apps, company profiles, and side projects.
        </p>

        <Stagger className="mt-10 grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2">
          {projects.map((p, i) => (
            <StaggerItem key={p.id}>
              <ProjectCard p={p} i={i} />
            </StaggerItem>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-ink-muted">Belum ada project.</p>
          )}
        </Stagger>

        <div className="mt-14">
          <Link href="/" className="pill pill-outline">
            ← Back home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
