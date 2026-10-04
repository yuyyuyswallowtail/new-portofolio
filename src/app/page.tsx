import Image from "next/image";
import Link from "next/link";
import { ArticleCover } from "@/components/site/article-cover";
import { SiteFooter } from "@/components/site/footer";
import { HeroCanvas } from "@/components/site/hero-canvas";
import { SiteNav } from "@/components/site/nav";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { listRecentForHome } from "@/modules/articles/service";
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
        <main className="mx-auto max-w-6xl px-6 py-24">
          <h1 className="text-2xl font-semibold">Belum ada profil</h1>
          <p className="mt-2 text-ink-muted">
            Jalankan <code className="font-data">bun run seed:content</code>{" "}
            dulu.
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const [
    education,
    experiences,
    certifications,
    skills,
    projects,
    recentArticles,
  ] = await Promise.all([
    listEducation(owner.id),
    listExperiences(owner.id),
    listCertifications(owner.id),
    listSkills(owner.id),
    listProjects(owner.id),
    listRecentForHome(3),
  ]);

  const skillsByCategory = skills.reduce<Record<string, typeof skills>>(
    (acc, s) => {
      const key = s.category ?? "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(s);
      return acc;
    },
    {},
  );

  const timeline = [
    ...experiences.map((e) => ({
      id: e.id,
      title: e.title,
      org: e.organization,
      start: e.startDate,
      end: e.endDate,
      description: e.description,
    })),
  ].sort((a, b) => (b.start ?? "").localeCompare(a.start ?? ""));

  return (
    <>
      <SiteNav />
      <main>
        {/* ---------- Hero ---------- */}
        <section className="relative flex min-h-[92vh] items-center overflow-hidden border-b border-line">
          <div className="bg-blueprint-grid absolute inset-0" />
          <HeroCanvas />
          <div className="relative mx-auto w-full max-w-6xl px-6 py-20">
            <p className="font-data mb-5 text-sm text-accent">
              Software Engineer &amp; Full Stack Web Developer
            </p>
            <h1 className="text-display">{owner.name ?? "Bintang Mesir"}</h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-muted md:text-xl">
              {owner.bio ??
                "Software Engineer building scalable, modern web applications."}
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="#projects"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                View projects
              </Link>
              {owner.cvUrl && (
                <a
                  href={owner.cvUrl}
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Download CV
                </a>
              )}
            </div>
            <div className="font-data mt-20 flex items-center gap-2 text-xs text-ink-muted">
              <span className="h-px w-8 bg-line" />
              scroll to explore
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6">
          {/* ---------- About ---------- */}
          <section id="about" className="py-20 md:py-28">
            <SectionHeading index={1} title="About" />
            <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_280px]">
              <Reveal delay={0.05}>
                <div className="max-w-[72ch] space-y-4 leading-relaxed text-ink-muted">
                  {(owner.bio ?? "")
                    .split("\n\n")
                    .filter(Boolean)
                    .map((para) => (
                      <p key={para.slice(0, 24)}>{para}</p>
                    ))}
                </div>
              </Reveal>
              <Reveal
                delay={0.1}
                className="font-data space-y-3 text-sm text-ink-muted"
              >
                {owner.profileUrl && (
                  <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-[6px] border border-line">
                    <Image
                      src={owner.profileUrl}
                      alt={owner.name ?? "Profile"}
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                  </div>
                )}
                {owner.domicile && <p>domicile: {owner.domicile}</p>}
                {owner.email && <p>email: {owner.email}</p>}
                {owner.linkedinUrl && (
                  <p>
                    linkedin:{" "}
                    <a href={owner.linkedinUrl} className="text-accent">
                      ↗
                    </a>
                  </p>
                )}
              </Reveal>
            </div>
          </section>

          {/* ---------- Education ---------- */}
          <section
            id="education"
            className="border-t border-line py-20 md:py-28"
          >
            <SectionHeading index={2} title="Education" />
            <div className="space-y-4">
              {education.map((e, i) => (
                <Reveal key={e.id} delay={i * 0.05}>
                  <Card className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                    <div>
                      <p className="text-lg font-medium">
                        {e.degree ?? e.institution}
                      </p>
                      <p className="text-sm text-ink-muted">{e.institution}</p>
                    </div>
                    <div className="font-data flex items-center gap-3 text-xs text-ink-muted">
                      <span>
                        {formatDate(e.startDate)} —{" "}
                        {e.endDate ? formatDate(e.endDate) : "now"}
                      </span>
                      {e.gpa && <Badge tone="accent">GPA {e.gpa}</Badge>}
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ---------- Experience ---------- */}
          <section
            id="experience"
            className="border-t border-line py-20 md:py-28"
          >
            <SectionHeading index={3} title="Experience & training" />
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <Reveal key={item.id} delay={i * 0.04}>
                  <div className="grid grid-cols-1 gap-2 border-b border-line pb-6 md:grid-cols-[160px_1fr]">
                    <p className="font-data text-xs text-ink-muted">
                      {formatDate(item.start)} —{" "}
                      {item.end ? formatDate(item.end) : "now"}
                    </p>
                    <div>
                      <p className="text-lg font-medium">{item.title}</p>
                      <p className="text-sm text-accent">{item.org}</p>
                      {item.description && (
                        <p className="mt-2 max-w-[65ch] text-sm text-ink-muted">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ---------- Certifications ---------- */}
          {certifications.length > 0 && (
            <section
              id="certifications"
              className="border-t border-line py-20 md:py-28"
            >
              <SectionHeading index={4} title="Certifications" />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {certifications.map((c, i) => (
                  <Reveal key={c.id} delay={i * 0.03}>
                    <Card className="p-0 overflow-hidden">
                      {c.imageUrl && (
                        <div className="relative aspect-[4/3] w-full">
                          <Image
                            src={c.imageUrl}
                            alt={c.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-medium leading-snug">
                          {c.title}
                        </p>
                        <p className="font-data mt-1 text-xs text-ink-muted">
                          {c.issuer}
                        </p>
                      </div>
                    </Card>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          {/* ---------- Skills ---------- */}
          <section id="skills" className="border-t border-line py-20 md:py-28">
            <SectionHeading index={5} title="Skills" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {Object.entries(skillsByCategory).map(([category, items], i) => (
                <Reveal key={category} delay={i * 0.05}>
                  <p className="font-data mb-3 text-xs text-ink-muted">
                    {category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((s) => (
                      <Badge
                        key={s.id}
                        tone="accent"
                        className="rounded-[4px] border border-line px-2 py-1"
                      >
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ---------- Projects ---------- */}
          <section
            id="projects"
            className="border-t border-line py-20 md:py-28"
          >
            <SectionHeading index={6} title="Projects" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {projects.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.05}>
                  <a
                    href={p.liveUrl || p.repoUrl || undefined}
                    target={p.liveUrl || p.repoUrl ? "_blank" : undefined}
                    rel="noreferrer"
                    className="group block overflow-hidden rounded-[6px] border border-line transition-colors hover:border-accent"
                  >
                    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-surface">
                      {p.imageUrl ? (
                        // biome-ignore lint/performance/noImgElement: project image may be a local upload, next/image optimization not essential here
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <>
                          <div className="bg-blueprint-grid absolute inset-0 opacity-40" />
                          <span className="font-data relative text-6xl font-semibold text-line transition-colors group-hover:text-accent/30">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-lg font-medium">{p.title}</p>
                        <Badge
                          tone={p.source === "github" ? "accent" : "default"}
                        >
                          {p.source}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-ink-muted">
                        {p.description}
                      </p>
                      <div className="mt-4 flex gap-3 font-data text-xs text-accent">
                        {p.repoUrl && <span>repo ↗</span>}
                        {p.liveUrl && <span>live ↗</span>}
                      </div>
                    </div>
                  </a>
                </Reveal>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-ink-muted">Belum ada project.</p>
              )}
            </div>
          </section>

          {/* ---------- Articles ---------- */}
          {recentArticles.length > 0 && (
            <section
              id="articles"
              className="border-t border-line py-20 md:py-28"
            >
              <SectionHeading index={7} title="Latest articles" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {recentArticles.map((a, i) => (
                  <Reveal key={a.id} delay={i * 0.05}>
                    <Link href={`/articles/${a.slug}`}>
                      <Card className="h-full transition-colors hover:border-accent">
                        <ArticleCover
                          src={a.coverImageUrl}
                          className="mb-4 w-full"
                        />
                        <div className="font-data flex items-center gap-2 text-xs text-ink-muted">
                          <span>{formatDate(a.publishedAt)}</span>
                          {a.aiGenerated && <Badge tone="accent">ai</Badge>}
                        </div>
                        <p className="mt-2 text-lg font-medium leading-snug">
                          {a.title}
                        </p>
                        <p className="mt-2 text-sm text-ink-muted">
                          {a.excerpt}
                        </p>
                      </Card>
                    </Link>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.1} className="mt-6">
                <Link
                  href="/articles"
                  className="font-data text-sm text-accent"
                >
                  View all articles →
                </Link>
              </Reveal>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
