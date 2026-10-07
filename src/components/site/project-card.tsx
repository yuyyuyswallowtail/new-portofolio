import { blockClass } from "@/components/site/blocks";
import { ClipReveal } from "@/components/site/motion";
import { cn } from "@/lib/utils";
import type { listProjects } from "@/modules/content/repository";

export type Project = Awaited<ReturnType<typeof listProjects>>[number];

const miniLink = "relative z-10 hover:underline";

export function ProjectCard({ p, i }: { p: Project; i: number }) {
  // Klik di gambar/judul: live kalau ada, kalau tidak repo.
  const mainHref = p.liveUrl || p.repoUrl || undefined;

  return (
    <div className="group relative">
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
          {mainHref ? (
            <a
              href={mainHref}
              target="_blank"
              rel="noreferrer"
              className="after:absolute after:inset-0 after:z-[1]"
            >
              {p.title}
            </a>
          ) : (
            p.title
          )}
        </h3>
        <span className="chip shrink-0 text-ink-muted">{p.source}</span>
      </div>
      {p.description && (
        <p className="mt-2 line-clamp-2 text-ink-muted">{p.description}</p>
      )}
      {(p.repoUrl || p.liveUrl) && (
        <p className="font-data mt-3 flex gap-3 text-xs text-accent-strong">
          {p.repoUrl && (
            <a
              href={p.repoUrl}
              target="_blank"
              rel="noreferrer"
              className={miniLink}
            >
              repo ↗
            </a>
          )}
          {p.liveUrl && (
            <a
              href={p.liveUrl}
              target="_blank"
              rel="noreferrer"
              className={miniLink}
            >
              live ↗
            </a>
          )}
        </p>
      )}
    </div>
  );
}
