import Link from "next/link";
import { Accordion } from "@/components/site/accordion";
import { ArticleCard } from "@/components/site/article-card";
import { blockClass } from "@/components/site/blocks";
import { CertGallery } from "@/components/site/cert-gallery";
import { SiteFooter } from "@/components/site/footer";
import { HeroSection } from "@/components/site/hero-section";
import { Marquee } from "@/components/site/marquee";
import {
  ActiveOnScroll,
  ClipReveal,
  CountUp,
  Stagger,
  StaggerItem,
} from "@/components/site/motion";
import { SiteNav } from "@/components/site/nav";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { StackSection } from "@/components/site/stack-section";
import { cn, formatDate } from "@/lib/utils";
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

type Project = Awaited<ReturnType<typeof listProjects>>[number];

function ProjectCard({ p, i }: { p: Project; i: number }) {
  const href = p.liveUrl || p.repoUrl || undefined;
  const body = (
    <>
      <ClipReveal>
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden rounded-[28px] text-on-block",
            blockClass(i),
          )}
        >
          {p.imageUrl ? (
            // biome-ignore lint/performance/noImgElement: gambar project bisa berupa upload lokal, optimasi next/image tidak penting di sini
            <img
              src={p.imageUrl}
              alt={p.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-8xl font-extrabold tracking-tighter opacity-80">
              {String(i + 1).padStart(2, "0")}
            </span>
          )}
          {p.featured && (
            <span className="font-data absolute left-4 top-4 rounded-full bg-bg px-3 py-1 text-xs text-ink">
              featured
            </span>
          )}
        </div>
      </ClipReveal>
      <div className="mt-4 flex items-start justify-between gap-4">
        <h3 className="text-2xl font-semibold tracking-tight group-hover:underline">
          {p.title}
        </h3>
        <span className="chip shrink-0 text-ink-muted">{p.source}</span>
      </div>
      {p.description && (
        <p className="mt-2 line-clamp-2 text-ink-muted">{p.description}</p>
      )}
      <p className="font-data mt-3 text-xs text-accent-strong">
        {p.repoUrl && "repo ↗  "}
        {p.liveUrl && "live ↗"}
      </p>
    </>
  );

  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="group block">
      {body}
    </a>
  ) : (
    <div className="group block">{body}</div>
  );
}

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
  const skillItems = Object.entries(skillsByCategory).map(
    ([category, items]) => ({
      id: category,
      title: category,
      count: items.length,
      content: (
        <div className="flex flex-wrap gap-2">
          {items.map((s) => (
            <span
              key={s.id}
              className="rounded-full border border-line px-4 py-2 text-sm font-medium"
            >
              {s.name}
            </span>
          ))}
        </div>
      ),
    }),
  );

  const timeline = experiences
    .map((e) => ({
      id: e.id,
      title: e.title,
      org: e.organization,
      type: e.type,
      start: e.startDate,
      end: e.endDate,
      description: e.description,
    }))
    .sort((a, b) => (b.start ?? "").localeCompare(a.start ?? ""));

  const startYears = experiences
    .map((e) => Number(e.startDate?.slice(0, 4)))
    .filter((y) => y > 1970);
  const years =
    startYears.length > 0
      ? new Date().getFullYear() - Math.min(...startYears)
      : 0;
  const stats = [
    { label: "Projects", value: projects.length },
    { label: "Certifications", value: certifications.length },
    { label: "Technologies", value: skills.length },
    { label: "Years building", value: years },
  ].filter((s) => s.value > 0);

  const name = owner.name ?? "Bintang Mesir";
  const bioParas = (owner.bio ?? "").split("\n\n").filter(Boolean);
  const tagline =
    (owner.bio ?? "").split(/(?<=[.!?])\s/)[0] ??
    "Software Engineer building scalable, modern web applications.";

  return (
    <>
      <SiteNav />
      {/* Semua section dan footer adalah sibling langsung di <main>:
          syarat agar efek "ditutupi section berikutnya" (sticky) bekerja. */}
      <main>
        <StackSection index={0} id="top" bare>
          <HeroSection
            name={name}
            tagline={tagline}
            domicile={owner.domicile}
            cvUrl={owner.cvUrl}
            profileUrl={owner.profileUrl}
          />
          <Marquee items={skills.slice(0, 24).map((s) => s.name)} />
        </StackSection>

        {/* ---------- Projects ---------- */}
        <StackSection index={1} id="projects" tone="surface">
          <SectionHeading
            index={1}
            title="Selected projects"
            kicker="Selected work"
          />
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
        </StackSection>

        {/* ---------- About ---------- */}
        <StackSection index={2} id="about">
          <SectionHeading index={2} title="About me" kicker="About" />
          <Stagger gap={0.12}>
            {bioParas[0] && (
              <StaggerItem>
                <p className="max-w-4xl text-2xl font-semibold leading-tight tracking-tight md:text-4xl">
                  {bioParas[0]}
                </p>
              </StaggerItem>
            )}
            {bioParas.length > 1 && (
              <StaggerItem>
                <div className="mt-8 max-w-[65ch] space-y-4 leading-relaxed text-ink-muted">
                  {bioParas.slice(1).map((para) => (
                    <p key={para.slice(0, 24)}>{para}</p>
                  ))}
                </div>
              </StaggerItem>
            )}
            <StaggerItem>
              <div className="font-data mt-10 flex flex-wrap gap-3 text-xs">
                {owner.domicile && (
                  <span className="chip text-ink-muted">{owner.domicile}</span>
                )}
                {owner.email && (
                  <a
                    href={`mailto:${owner.email}`}
                    className="chip text-ink-muted hover:text-ink"
                  >
                    {owner.email}
                  </a>
                )}
                {owner.linkedinUrl && (
                  <a
                    href={owner.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="chip text-ink-muted hover:text-ink"
                  >
                    linkedin ↗
                  </a>
                )}
              </div>
            </StaggerItem>
          </Stagger>
        </StackSection>

        {/* ---------- Skills ---------- */}
        {skillItems.length > 0 && (
          <StackSection index={3} id="skills" tone="surface">
            <SectionHeading
              index={3}
              title="What I work with"
              kicker="Skills"
            />
            <Reveal>
              <Accordion items={skillItems} />
            </Reveal>
          </StackSection>
        )}

        {/* ---------- Stats ---------- */}
        {stats.length > 0 && (
          <StackSection index={4}>
            <SectionHeading index={4} title="By the numbers" kicker="Impact" />
            <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {stats.map((s, i) => (
                <StaggerItem key={s.label}>
                  <div
                    className={cn(
                      "flex min-h-48 flex-col justify-between rounded-[28px] p-6 text-on-block",
                      blockClass(i + 1),
                    )}
                  >
                    <span className="font-data text-xs uppercase tracking-widest opacity-70">
                      {s.label}
                    </span>
                    <CountUp value={s.value} className="display-lg" />
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </StackSection>
        )}

        {/* ---------- Experience ---------- */}
        <StackSection index={5} id="experience" tone="surface">
          <SectionHeading
            index={5}
            title="Experience & training"
            kicker="Experience"
          />
          <div className="border-b border-line">
            {timeline.map((item) => (
              <ActiveOnScroll key={item.id}>
                <div className="grid gap-3 border-t border-line py-7 md:grid-cols-[200px_1fr_auto] md:gap-8">
                  <p className="font-data text-xs text-ink-muted">
                    {formatDate(item.start)} —{" "}
                    {item.end ? formatDate(item.end) : "now"}
                  </p>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-ink-muted">{item.org}</p>
                    {item.description && (
                      <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-ink-muted">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <span className="chip h-fit self-start text-ink-muted">
                    {item.type}
                  </span>
                </div>
              </ActiveOnScroll>
            ))}
          </div>
        </StackSection>

        {/* ---------- Education ---------- */}
        {education.length > 0 && (
          <StackSection index={6} id="education">
            <SectionHeading index={6} title="Education" />
            <div className="border-b border-line">
              {education.map((e) => (
                <ActiveOnScroll key={e.id}>
                  <div className="grid gap-3 border-t border-line py-7 md:grid-cols-[200px_1fr_auto] md:gap-8">
                    <p className="font-data text-xs text-ink-muted">
                      {formatDate(e.startDate)} —{" "}
                      {e.endDate ? formatDate(e.endDate) : "now"}
                    </p>
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        {e.degree ?? e.institution}
                      </h3>
                      <p className="mt-1 text-ink-muted">{e.institution}</p>
                    </div>
                    {e.gpa && (
                      <span className="chip h-fit self-start text-ink-muted">
                        GPA {e.gpa}
                      </span>
                    )}
                  </div>
                </ActiveOnScroll>
              ))}
            </div>
          </StackSection>
        )}

        {/* ---------- Certifications ---------- */}
        {certifications.some((c) => c.imageUrl) && (
          <section
            id="certifications"
            style={{ zIndex: 8 }}
            className="relative rounded-t-[28px] bg-surface shadow-[0_-24px_48px_-28px_rgb(0_0_0/0.35)] md:rounded-t-[40px]"
          >
            <CertGallery
              index={7}
              items={certifications.flatMap((c) =>
                c.imageUrl
                  ? [
                      {
                        id: c.id,
                        title: c.title,
                        issuer: c.issuer,
                        imageUrl: c.imageUrl,
                        verifyUrl: c.verifyUrl,
                      },
                    ]
                  : [],
              )}
            />
          </section>
        )}

        {/* ---------- Articles ---------- */}
        {recentArticles.length > 0 && (
          <StackSection index={8} id="articles">
            <SectionHeading
              index={8}
              title="Latest articles"
              kicker="Writing"
            />
            <Stagger className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-3">
              {recentArticles.map((a, i) => (
                <StaggerItem key={a.id}>
                  <ArticleCard a={a} index={i} />
                </StaggerItem>
              ))}
            </Stagger>
            <div className="mt-12">
              <Link href="/articles" className="pill pill-outline">
                View all articles →
              </Link>
            </div>
          </StackSection>
        )}

        {/* Footer menutup section terakhir dengan cara yang sama (z di bawah nav, z-30). */}
        <div className="footer-invert relative" style={{ zIndex: 20 }}>
          <SiteFooter />
        </div>
      </main>
    </>
  );
}
