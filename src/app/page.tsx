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
  CountUp,
  Stagger,
  StaggerItem,
} from "@/components/site/motion";
import { SiteNav } from "@/components/site/nav";
import { ProjectCard } from "@/components/site/project-card";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { SkillPile } from "@/components/site/skill-pile";
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

// Jumlah project di home. Sisanya ada di /projects.
const HOME_PROJECT_LIMIT = 6;

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

  const homeProjects = projects.slice(0, HOME_PROJECT_LIMIT);

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

  // Tumpukan sticker logo: tampil kalau minimal satu skill sudah punya logo.
  const pileItems = skills.map((s) => ({
    id: s.id,
    name: s.name,
    logoUrl: s.logoUrl,
  }));
  const showPile = skills.some((s) => s.logoUrl);

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
          syarat agar efek "ditutupi section berikutnya" (sticky) bekerja.
          Urutan: Hero, About, Education, Experience, By the numbers,
          Projects, Certifications, Skills, Articles, lalu footer (Contact). */}
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

        {/* ---------- About ---------- */}
        <StackSection index={1} id="about">
          <SectionHeading index={1} title="About me" kicker="About" />
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

        {/* ---------- Education ---------- */}
        {education.length > 0 && (
          <StackSection index={2} id="education" tone="surface">
            <SectionHeading index={2} title="Education" />
            <div className="border-b border-line">
              {education.map((e) => (
                <ActiveOnScroll key={e.id}>
                  <div className="grid gap-3 border-t border-line py-7 md:grid-cols-[200px_1fr_auto] md:gap-8">
                    <p className="font-data text-xs text-ink-muted">
                      {formatDate(e.startDate)} —{" "}
                      {e.endDate ? formatDate(e.endDate) : "now"}
                    </p>
                    <div className="flex items-start gap-5">
                      {e.imageUrl && (
                        // biome-ignore lint/performance/noImgElement: gambar kecil (thumbnail institusi), optimasi next/image tidak perlu
                        <img
                          src={e.imageUrl}
                          alt={e.institution}
                          loading="lazy"
                          className="h-20 w-20 shrink-0 rounded-2xl object-cover shadow-[0_14px_32px_-14px_rgb(0_0_0/0.5)] ring-1 ring-line md:h-28 md:w-28"
                        />
                      )}
                      <div>
                        <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                          {e.degree ?? e.institution}
                        </h3>
                        <p className="mt-1 text-ink-muted">{e.institution}</p>
                      </div>
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

        {/* ---------- Experience ---------- */}
        <StackSection index={3} id="experience">
          <SectionHeading
            index={3}
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

        {/* ---------- Stats ---------- */}
        {stats.length > 0 && (
          <StackSection index={4} tone="surface">
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

        {/* ---------- Projects ---------- */}
        <StackSection index={5} id="projects">
          <SectionHeading
            index={5}
            title="Selected projects"
            kicker="Selected work"
          />
          <Stagger className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2">
            {homeProjects.map((p, i) => (
              <StaggerItem key={p.id}>
                <ProjectCard p={p} i={i} />
              </StaggerItem>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-ink-muted">Belum ada project.</p>
            )}
          </Stagger>
          {projects.length > 0 && (
            <div className="mt-12">
              <Link href="/projects" className="pill pill-outline">
                View projects →
              </Link>
            </div>
          )}
        </StackSection>

        {/* ---------- Certifications ---------- */}
        {certifications.some((c) => c.imageUrl) && (
          <section
            id="certifications"
            style={{ zIndex: 7 }}
            className="relative rounded-t-[28px] bg-surface shadow-[0_-24px_48px_-28px_rgb(0_0_0/0.35)] md:rounded-t-[40px]"
          >
            <CertGallery
              index={6}
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

        {/* ---------- Skills ---------- */}
        {skillItems.length > 0 && (
          <StackSection index={7} id="skills">
            <SectionHeading
              index={7}
              title="What I work with"
              kicker="Skills"
            />
            <Reveal>
              <Accordion items={skillItems} />
            </Reveal>
            {showPile && (
              <div className="mt-14">
                <SkillPile items={pileItems} />
              </div>
            )}
          </StackSection>
        )}

        {/* ---------- Articles ---------- */}
        {recentArticles.length > 0 && (
          <StackSection index={8} id="articles" tone="surface">
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

        {/* Footer (Contact) menutup section terakhir dengan cara yang sama (z di bawah nav, z-30). */}
        <div className="footer-invert relative" style={{ zIndex: 20 }}>
          <SiteFooter />
        </div>
      </main>
    </>
  );
}
