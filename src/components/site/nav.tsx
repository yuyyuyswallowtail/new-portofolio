import Link from "next/link";

export function SiteNav() {
  return (
    <header className="border-b border-line">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-data text-sm text-ink-muted hover:text-accent"
        >
          ~/yuyyuy
        </Link>
        <div className="flex gap-6 text-sm">
          <Link href="/#projects" className="text-ink hover:text-accent">
            Projects
          </Link>
          <Link href="/articles" className="text-ink hover:text-accent">
            Articles
          </Link>
          <Link href="/contact" className="text-ink hover:text-accent">
            Contact
          </Link>
          <Link href="/login" className="text-ink-muted hover:text-accent">
            Dashboard
          </Link>
        </div>
      </nav>
    </header>
  );
}
