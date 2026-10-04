import Link from "next/link";
import { getOwnerProfile } from "@/modules/content/repository";

export async function SiteFooter() {
  const owner = await getOwnerProfile();

  return (
    <footer id="contact-footer" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_auto]">
          <div>
            <p className="font-data text-sm text-accent">Let's work together</p>
            <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
              {owner?.email ?? "hello@bintangmesir.dev"}
            </h2>
            <div className="font-data mt-4 space-y-1 text-sm text-ink-muted">
              {owner?.phone && <p>{owner.phone}</p>}
              <div className="flex gap-4">
                {owner?.linkedinUrl && (
                  <a
                    href={owner.linkedinUrl}
                    className="hover:text-accent"
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn ↗
                  </a>
                )}
                {owner?.githubUsername && (
                  <a
                    href={`https://github.com/${owner.githubUsername}`}
                    className="hover:text-accent"
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub ↗
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-end gap-1 text-right">
            <span className="font-data text-xs text-ink-muted">
              © {new Date().getFullYear()} {owner?.name ?? "Bintang Mesir"}
            </span>
            <span className="font-data text-xs text-ink-muted">
              built with Next.js · Drizzle · Three.js · Framer Motion
            </span>
            {/* Deliberately small/muted, not in the main nav — see SECURITY.md */}
            <Link
              href="/login"
              className="font-data text-xs text-ink-muted hover:text-accent"
            >
              staff login →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
