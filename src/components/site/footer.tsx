import Link from "next/link";
import { GithubActivity } from "@/components/site/github-activity";
import { RevealText } from "@/components/site/motion";
import { RetroComputerSlot } from "@/components/site/retro-computer-slot";
import { getOwnerProfile } from "@/modules/content/repository";
import { NAV_LINKS as LINKS } from "./nav-links";

const onBlockLink =
  "rounded-full border border-on-block px-4 py-2 text-sm font-medium transition-colors hover:bg-on-block hover:text-white";

export async function SiteFooter() {
  const owner = await getOwnerProfile();
  const email = owner?.email ?? "hello@bintangmesir.dev";
  const name = owner?.name ?? "Bintang Mesir";

  return (
    <footer id="contact-footer">
      <div className="mx-auto max-w-6xl px-6 pt-16">
        <RetroComputerSlot />
        <div className="grid gap-4 md:grid-cols-2">
          <a
            href={`mailto:${email}`}
            className="flex min-h-56 flex-col justify-between rounded-[28px] bg-block-yellow p-7 text-on-block transition-transform hover:-translate-y-1"
          >
            <span className="font-data text-xs uppercase tracking-widest opacity-70">
              Prefer mail?
            </span>
            <span className="break-all text-2xl font-semibold tracking-tight md:text-4xl">
              {email} ↗
            </span>
          </a>

          <div className="flex min-h-56 flex-col justify-between rounded-[28px] bg-block-blue p-7 text-on-block">
            <span className="font-data text-xs uppercase tracking-widest opacity-70">
              Let&apos;s work together
            </span>
            <div>
              <p className="text-2xl font-semibold tracking-tight md:text-4xl">
                Find me elsewhere
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {owner?.linkedinUrl && (
                  <a
                    href={owner.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={onBlockLink}
                  >
                    LinkedIn ↗
                  </a>
                )}
                {owner?.githubUsername && (
                  <a
                    href={`https://github.com/${owner.githubUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className={onBlockLink}
                  >
                    GitHub ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {owner?.githubUsername && (
          <GithubActivity username={owner.githubUsername} />
        )}

        <div className="mt-12 flex flex-col justify-between gap-6 border-t border-line pt-6 md:flex-row md:items-center">
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ink-muted hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="font-data flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-muted">
            <span>
              © {new Date().getFullYear()} {name}
            </span>
            <span>built with Next.js · Drizzle · Framer Motion</span>
          </div>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="mt-10 select-none overflow-hidden whitespace-nowrap px-4 pb-6 text-center text-[11.5vw] font-extrabold uppercase leading-[0.82] tracking-tighter"
      >
        <RevealText text={name} />
      </p>
    </footer>
  );
}
