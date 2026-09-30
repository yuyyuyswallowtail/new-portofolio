# Portofolio

Full-stack rebuild: portfolio (hero/about/education/experience/certifications/
skills/projects/contact) + an AI-assisted articles module + RBAC dashboard.
Runs entirely via Docker Compose (Next.js app + Postgres), no Supabase account
required to get started locally.

## What's implemented in this scaffold

- Drizzle schema for all PRD.md §6 tables + `role` enum on `users`
- Sessions (DB-backed, httpOnly cookie), argon2 password hashing
- `lib/rbac.ts#can()` + RLS policies (`src/db/policies.sql`) — the 3-layer model from ARCHITECTURE.md §4
- Public site: hero/about/education+experience timeline/certifications/skills/projects/contact
- Articles: public list + detail (Markdown → sanitized HTML), dashboard list, manual editor,
  **"Generate with AI" button** — Gemini 2.5 Flash writes the article (topic: AI / web dev /
  networking), Gemini 2.5 Flash Image ("Nano Banana") generates a cover image. Always saved
  as a draft — a human still has to hit Publish.
- Design tokens from DESIGN_SYSTEM.md wired into `globals.css` + Tailwind v4 `@theme`
- Minimal hand-rolled UI primitives (Button/Card/Badge/Input/Textarea/Label) in the same
  visual language as shadcn — swap for real shadcn components anytime with `bunx shadcn add`

## What's intentionally left for you to extend

- GitHub repo sync for Projects (source: "manual" works now; "github" sync job is not wired)
- File uploads for certification images / CV (currently plain `imageUrl`/`cvUrl` text fields —
  point them at any URL for now; Supabase Storage wiring is a follow-up per PRD.md open questions)
- Dashboard CRUD screens for education/experience/certifications/skills/projects (repository
  functions exist in `src/modules/content/`; only read-paths + the public page are wired.
  Copy the pattern from `src/modules/articles/` to add the write-side dashboard forms)
- `/dashboard/users` page (route exists in nav, page not yet built — user management is
  `SUPER_ADMIN`-only per PRD.md §4 A10)
- Automated tests (see CODE_STYLE.md §7 for the intended approach)

## Quick start (Docker)

```bash
cd portofolio
cp .env.example .env          # .env with a placeholder GEMINI_API_KEY already exists — replace it
docker compose up --build
```

On first boot the `app` container runs `drizzle-kit migrate` automatically (see
`docker-entrypoint.sh`). Then, in another terminal, create the first admin account:

```bash
docker compose exec app bun run seed:admin
```

Open http://localhost:3000 (public site) and http://localhost:3000/login (staff).

## Quick start (bare metal / no Docker)

```bash
bun install
cp .env.example .env
# start your own Postgres and point DATABASE_URL/DIRECT_URL at it, or:
docker compose up db -d
bun run db:generate
bun run db:migrate
psql "$DATABASE_URL" -f src/db/policies.sql   # apply RLS policies
bun run seed:admin
bun run dev
```

## The Gemini API key

`.env` already has `GEMINI_API_KEY=` filled in with the placeholder value you gave me, in
`src/lib/gemini.ts` is exactly where it's read (`process.env.GEMINI_API_KEY`). Get a real
free-tier key at https://aistudio.google.com/app/apikey and replace it — the free tier has
a daily request quota per model, so if "Generate with AI" errors out with a quota message,
that's expected occasionally, not a bug.

## Docs

See `PRD.md`, `ARCHITECTURE.md`, `SECURITY.md`, `DESIGN_SYSTEM.md`, `CODE_STYLE.md`,
`AGENTS.md` at the repo root — carried over from the planning phase, now living alongside
the actual code they describe.
