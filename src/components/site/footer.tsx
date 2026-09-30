export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-5xl px-6 py-10 text-xs text-ink-muted font-data">
      © {new Date().getFullYear()} Yuyyuy. Built with Next.js, Drizzle,
      Postgres.
    </footer>
  );
}
