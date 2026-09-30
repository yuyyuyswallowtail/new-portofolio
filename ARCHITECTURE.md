# ARCHITECTURE — Portofolio v2

Companion to `PRD.md` (what/why) and `SECURITY.md` (threat model). This file is the how.

## 1. Layered architecture (adapted from the Spring Boot / DRF conventions to Next.js)

Yuyyuy's other projects (`crud-rbac-django`, `admin-crud`) use a layered split: controller → service → repository. Next.js doesn't have controllers in the same sense, but the same separation maps cleanly:

```
Route / Server Action   (controller layer)
        │  — parses input, calls a service, shapes the response
        ▼
Service                 (business logic layer)
        │  — permission checks, orchestration, calls repository
        ▼
Repository              (data access layer)
        │  — Drizzle queries only, no business rules
        ▼
Drizzle + Postgres (Supabase, RLS enforced)
```

Rule of thumb: **route/action files stay thin**. If a handler has more than input parsing + one service call + response shaping, that logic belongs in a service.

## 2. Folder structure (target state)

```
src/
├── app/                        # App Router — routes only, thin
│   ├── (public)/               # public site route group
│   │   ├── page.tsx            # hero/about/education/... composed here
│   │   ├── projects/
│   │   ├── articles/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   └── contact/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # role-aware nav, guarded by middleware + layout check
│   │   ├── dashboard/page.tsx
│   │   ├── articles/
│   │   ├── projects/
│   │   ├── certifications/
│   │   └── users/              # SUPER_ADMIN only
│   └── api/                    # only for things that must be REST (webhooks, GitHub sync cron)
├── modules/                    # feature modules — the real business logic
│   ├── auth/
│   │   ├── service.ts          # login, session issuance, permission helpers
│   │   ├── repository.ts       # user lookups
│   │   └── schema.ts           # zod schemas for login form
│   ├── articles/
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   ├── actions.ts          # "use server" actions, thin, call service
│   │   └── schema.ts
│   ├── projects/
│   ├── education/
│   ├── experiences/
│   ├── certifications/
│   ├── skills/
│   └── users/                  # role management (SUPER_ADMIN)
├── db/
│   ├── schema.ts                # Drizzle schema, all tables, all .enableRLS()
│   ├── client.ts                 # postgres() + drizzle() singleton
│   └── policies.sql              # RLS policy definitions (or drizzle-kit if/when it supports policies natively)
├── lib/
│   ├── password.ts               # existing — argon2 hash/verify
│   ├── session.ts                 # cookie session helpers
│   ├── rbac.ts                    # can(user, action, resource) — single source of truth for permission checks
│   └── utils.ts
├── components/
│   ├── ui/                        # shadcn/Base UI primitives, unmodified
│   └── (feature)/                 # composed, feature-specific components
├── stores/                        # zustand stores (UI state only — never server state)
└── middleware.ts                  # route guard: redirect unauthenticated/under-privileged requests
```

**Why `modules/` instead of spreading logic across `app/`:** route handlers and server actions are entry points, not owners of logic. Keeping service/repository/schema together per feature keeps each `feature/*` branch in §"Feature → branch mapping" of `PRD.md` scoped to one folder plus its route.

## 3. Data layer

- **ORM:** Drizzle only. No raw SQL outside `db/policies.sql` and migrations.
- **Migrations:** `db:generate` → review the generated SQL → `db:migrate`. `db:push` is for local iteration only, never against the Supabase production branch.
- **RLS:** every table calls `.enableRLS()` (already the convention in `schema.ts`). Policies live in `db/policies.sql` and are applied via a migration, not the Drizzle Kit push flow, since Drizzle doesn't own policy authoring the same way it owns table shape.
- **Soft delete:** every content table gets `deletedAt timestamp` (nullable). Repository layer filters `WHERE deleted_at IS NULL` by default; a `withDeleted()` escape hatch exists only for `SUPER_ADMIN` admin views.

## 4. Auth & session flow

1. `POST /login` (server action) → `auth/service.ts` looks up user by email → `password.ts` verifies against `password`+`salt` with argon2 → on success, issue a server-side session (signed, httpOnly cookie; store session row in a `sessions` table or a signed stateless JWT — pick one and document the choice here once decided, see open question in `SECURITY.md`).
2. `middleware.ts` reads the session cookie on every request to a `(dashboard)` route and redirects to `/login` if absent/expired. This is a **coarse** check (authenticated vs not) — it does not know about roles.
3. The `(dashboard)/layout.tsx` (server component) loads the current user + role and calls `lib/rbac.ts#can()` to decide what nav items/sections render. This is the **role-aware** check.
4. Every server action/mutation calls `can(user, action, resource)` again before touching the repository layer. **Never trust the UI having hidden a button** — the action-level check is the one that actually matters; the layout-level check is UX, not security.
5. RLS policies are the last line: even if a service layer check were ever missing or buggy, Postgres refuses the row-level operation for a session that doesn't own/have rights to that row.

This is the "3 layers must agree" model referenced in `PRD.md` §4 and detailed in `SECURITY.md`.

## 5. State management boundaries

- **Server state** (anything from the DB): TanStack Query on the client for dashboard interactivity (optimistic updates, cache invalidation after mutation), Server Components + `fetch`/direct DB calls for the public site (no client-side fetching needed for read-only public pages).
- **Client/UI state** (modals open, form step, theme toggle, sidebar collapsed): Zustand. Never put server data in a Zustand store — that's what TanStack Query's cache is for.
- **Forms:** `react-hook-form` + `zod` resolver, same zod schema reused for the server action's own input validation (don't validate twice with two different schemas).

## 6. Projects feature: GitHub sync

Two data sources feed the Projects section, matching the old site's live-repo behavior:
- **Manual projects** — authored in the dashboard, stored in `projects`, full control over copy/image.
- **GitHub-synced projects** — fetched from the GitHub REST API (`/users/{username}/repos`), cached (ISR revalidation or a scheduled route handler that upserts into `projects` with `source = 'github'`). Prefer **pull-on-a-schedule into the DB** over client-side fetching at request time — keeps the public page fast and avoids hitting GitHub's rate limit per visitor.

## 7. Rendering strategy per route

| Route | Strategy | Reason |
|---|---|---|
| `/` (hero/about/education/...) | ISR, revalidate on save from dashboard | Content changes rarely, should be instant for visitors |
| `/articles`, `/articles/[slug]` | ISR, revalidate on publish | Same reasoning, plus good SEO/OG behavior |
| `/projects` | ISR + on-demand revalidation after GitHub sync job | |
| `(dashboard)/*` | Fully dynamic, server components, no caching | Always show latest data to the editor |
| `/login` | Static shell, dynamic form | |

## 8. Open decisions to resolve before `feature/schema-rbac` merges

- Session strategy: DB-backed `sessions` table (revocable, matches RBAC/soft-delete pattern used elsewhere) vs stateless JWT (simpler, harder to revoke). Recommendation: DB-backed, since revocation (e.g. deactivating a staff account) is a real requirement in §4 of `PRD.md`.
- `role` as a Postgres enum column on `users` vs a separate `roles`/`user_roles` join table. A single enum column is enough for the matrix in `PRD.md` (each user has exactly one role); only move to a join table if multi-role-per-user becomes a real requirement.
