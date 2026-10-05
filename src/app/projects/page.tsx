import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/footer";
import { Stagger, StaggerItem } from "@/components/site/motion";
import { SiteNav } from "@/components/site/nav";
import { ProjectCard } from "@/components/site/project-card";
import { SectionHeading } from "@/components/site/section-heading";
import { getOwnerProfile, listProjects } from "@/modules/content/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const owner = await getOwnerProfile();
  const projects = owner ? await listProjects(owner.id) : [];

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-28">
        <SectionHeading index={1} title="All projects" kicker="Projects" />
        <Stagger className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2">
          {projects.map((p, i) => (
            <StaggerItem key={p.id}>
              <ProjectCard p={p} i={i} />
            </StaggerItem>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-ink-muted">Belum ada project.</p>
          )}
        </Stagger>
        <div className="mt-12">
          <Link href="/" className="pill pill-outline">
            ← Back home
          </Link>
        </div>
      </main>
      <div className="footer-invert relative">
        <SiteFooter />
      </div>
    </>
  );
}
