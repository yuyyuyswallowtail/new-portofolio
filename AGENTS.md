# AGENTS.md — Portofolio v2

Instructions for any AI coding agent (Claude Code or otherwise) working in this repository. Read `PRD.md`, `ARCHITECTURE.md`, `SECURITY.md`, `DESIGN_SYSTEM.md`, and `CODE_STYLE.md` before making non-trivial changes — this file is the entry point, not a replacement for them.

## 1. Project summary

Personal portfolio + blog for Yuyyuy, built with Next.js 16 (App Router), Bun, Drizzle ORM against Supabase Postgres, TanStack Query, Zustand, shadcn/Base UI, Tailwind v4. Public site (hero/about/education/experience/certifications/skills/projects/articles/contact) is backed by a small RBAC'd CMS instead of hardcoded JSX. Full requirements: `PRD.md`. Full technical shape: `ARCHITECTURE.md`.

## 2. Setup & commands

```bash
bun install
cp .env.example .env.local        # fill in DATABASE_URL, DIRECT_URL, SUPABASE_* keys
bun run db:generate                # generate SQL migration from schema.ts changes
bun run db:migrate                 # apply migrations
bun run dev                        # start dev server
bun run lint                       # biome check
bun run format                     # biome check --write
```

Never run `bun run db:push` against a database that has real content — it's for local schema prototyping only. Use `db:generate` + `db:migrate` for anything that will be committed.

## 3. Branching model

One branch per feature from the table in `PRD.md` §7 ("Feature → branch mapping"). Naming: `feature/<slug>` exactly as listed there (e.g. `feature/schema-rbac`, `feature/articles`). Rules:

- `feature/schema-rbac` merges to `develop` **first** — it adds the `role` column/enum, RLS baseline, and the `SUPER_ADMIN` seed script that every other feature depends on. Don't start `feature/auth` or any admin CRUD feature from a base that predates it.
- A feature branch only touches: its own `src/modules/<feature>/` folder, its own route(s) under `app/`, its own Drizzle table(s) in `schema.ts`, and (if needed) shared files it's explicitly extending — e.g. adding a nav link in the dashboard shell. If a branch needs to touch something outside that scope, that's a signal it's not actually scoped correctly; flag it instead of quietly expanding the diff.
- Commit messages inside a feature branch follow `CODE_STYLE.md` §5 (Conventional Commits, scope = feature slug).
- Merge target is `develop`; `main` only receives merges from `develop` for a release cut.

## 4. Before writing code

1. Check `PRD.md` §4 (permission matrix) and §6 (data model) for the feature you're touching — don't invent a role or a table shape that isn't already decided there; if it's genuinely missing, propose the addition to the user rather than silently deciding.
2. Check `ARCHITECTURE.md` for where the logic belongs (route vs service vs repository) and the rendering strategy for the route you're adding.
3. Check `SECURITY.md` §2 before writing any mutation — every server action needs a `can()` check; every new table needs an RLS policy in the same PR/branch that introduces it, not a follow-up.
4. Check `DESIGN_SYSTEM.md` before adding new UI — use the existing tokens, don't introduce a new color/font ad hoc.

## 5. Definition of done for a feature branch

- [ ] Zod schema for every input boundary (`CODE_STYLE.md` §2)
- [ ] Server action returns `ActionResult<T>`, not a thrown error for expected failures (`CODE_STYLE.md` §6)
- [ ] `can()` permission check present in every mutation (`SECURITY.md` §2)
- [ ] RLS policy added/updated for any new/changed table (`SECURITY.md` §2, `ARCHITECTURE.md` §3)
- [ ] Soft-delete (`deletedAt`) respected — no hard `DELETE` on content tables
- [ ] `biome check .` passes
- [ ] Commit messages follow Conventional Commits
- [ ] Public-facing pages use the rendering strategy specified in `ARCHITECTURE.md` §7 (ISR vs dynamic), not ad hoc `fetch` calls

## 6. What not to do

- Don't add a new formatter/linter alongside Biome.
- Don't query Drizzle directly from an `app/**/page.tsx` — go through a service.
- Don't add a role or permission shortcut ("just check `user.email === 'yuyyuy@...'" ") anywhere — always go through `lib/rbac.ts#can()`.
- Don't store secrets in `NEXT_PUBLIC_*` env vars — see `SECURITY.md` §4.
- Don't introduce a UI pattern that isn't in `DESIGN_SYSTEM.md` (an extra card style, a new accent color, a different font) without updating that file first.
