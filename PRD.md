# PRD — Portofolio v2

**Owner:** Yuyyuy
**Status:** Draft v1
**Stack:** Next.js 16 (App Router) · Bun · Drizzle ORM · Supabase Postgres · TanStack Query · Zustand · shadcn/Base UI · Tailwind v4

## 1. Background

The current repo (`portofolio`) is a fresh Next.js scaffold with a `users` table (email/password/salt, profile fields, skills array) and no content model yet. The previous portfolio (`portofolio-bintang-mesir.vercel.app`) is a static-content, single-owner site: Hero, About, Education, Experience & Training, Certifications gallery, Technical Skills, Projects (pulled live from GitHub), Contact + CV download.

v2 keeps every one of those sections **mandatory** (see §4), and adds two things the old site didn't have:

1. **RBAC** — an authenticated admin area to manage content instead of hardcoding it in JSX.
2. **Articles** — a blog/writing module (posts, tags, drafts) attached to the same account system.

## 2. Goals

- Replace static/hardcoded portfolio content with a database-backed CMS the owner can edit without redeploying.
- Introduce roles so the site can eventually support more than one contributor (e.g. a co-author on articles) without a rewrite.
- Ship a public site that is at least as complete as the old one, plus a blog, with production-grade auth and RLS.
- Keep the codebase in the same shape as Yuyyuy's other projects (layered architecture, RBAC, soft-delete, RLS) — see `crud-rbac-django` and `admin-crud` conventions — translated to the Next.js/Drizzle world.

## 3. Non-goals (v1 of this rebuild)

- Multi-tenant portfolios (this is a single-owner site with a small admin roster, not a SaaS).
- Real-time collaboration on articles (no live co-editing).
- Payments/monetization.
- Native mobile app.

## 4. Roles & Permission Matrix

| Capability | `SUPER_ADMIN` | `ADMIN` | `EDITOR` | `VIEWER` (auth'd) | Public (anon) |
|---|---|---|---|---|---|
| View public site (hero/about/projects/articles) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read published articles | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read draft articles | ✅ | ✅ | own drafts | ❌ | ❌ |
| Create/edit/publish articles | ✅ | ✅ | ✅ (own only) | ❌ | ❌ |
| Delete articles | ✅ | ✅ | own drafts only | ❌ | ❌ |
| Manage profile/about/education/experience | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage certifications | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage projects/skills | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage site settings (CV file, contact info) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage users & roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| View admin dashboard | ✅ | ✅ | ✅ (limited) | ❌ | ❌ |
| Comment on articles (optional, phase 2) | ✅ | ✅ | ✅ | ✅ | ❌ |

Notes:
- `SUPER_ADMIN` is a bootstrap role — practically it's Yuyyuy. Seeded once via a script, never self-registered.
- `EDITOR` exists for future collaborators (e.g. someone writing guest articles) without giving them access to personal/CV data.
- `VIEWER` is any signed-up account that isn't staff — only meaningful once comments (phase 2) ship. If comments are cut from v1, `VIEWER` can be deferred entirely and auth becomes staff-only.
- Enforcement happens in three places (see `ARCHITECTURE.md` and `SECURITY.md`): middleware route guard → server action/handler permission check → Postgres RLS policy. All three must agree; RLS is the backstop if the other two are bypassed.

## 5. Feature list (functional requirements)

### 5.1 Public site (parity with old portfolio, data-driven instead of hardcoded)

| # | Feature | Notes |
|---|---|---|
| F1 | Hero section | Name, role, one-liner, CTA to projects, CV download link |
| F2 | About | Rich-text bio (from `users.bio`), profile photo |
| F3 | Education | Timeline: institution, degree, period, GPA/notes |
| F4 | Experience & Training | Timeline: role/program, org, period, description |
| F5 | Certifications | Gallery: title, issuer, image, optional verify link |
| F6 | Technical skills | Tag list, optionally grouped by category (Languages/Frameworks/Databases) |
| F7 | Projects | Manual entries **and** live GitHub repo sync (old site's "Loading repositories…" behavior) |
| F8 | Contact + CV | Email, phone, LinkedIn, CV download (`cvUrl`) |
| F9 | Articles (blog) | List (paginated), detail page, tags/categories, reading time, SEO metadata |

### 5.2 Admin / CMS

| # | Feature | Notes |
|---|---|---|
| A1 | Auth | Login (email + password, argon2 via `@node-rs/argon2`); no public self-registration for staff roles |
| A2 | Session management | Server-side session, httpOnly cookie, logout, session expiry |
| A3 | Role-gated dashboard | `/dashboard` — sections shown/hidden per role from the matrix in §4 |
| A4 | Profile & about editor | Edit `users` row (bio, photo, phone, domicile, links) |
| A5 | Education/Experience CRUD | Ordered lists, drag-to-reorder (nice-to-have) |
| A6 | Certifications CRUD | Image upload (Supabase Storage), reorder |
| A7 | Skills CRUD | Add/remove/group |
| A8 | Projects CRUD | Manual projects + toggle for GitHub-synced ones |
| A9 | Articles editor | Markdown or rich-text editor, draft/publish workflow, tags |
| A10 | User & role management | `SUPER_ADMIN` only — invite/create staff accounts, assign roles, deactivate |

### 5.3 Non-functional requirements

- **Performance:** static/ISR for public pages where content changes infrequently (hero/about/education/certifications), on-demand revalidation triggered from the CMS on save.
- **SEO:** per-article metadata, OpenGraph image, sitemap.xml, robots.txt.
- **Accessibility:** keyboard-navigable, visible focus states, sufficient contrast (see `DESIGN_SYSTEM.md`).
- **Security:** see `SECURITY.md` — RBAC at 3 layers, RLS on every table, zod validation on every input boundary.
- **Reliability:** typed DB access only (Drizzle), migrations tracked in git, no destructive `db:push` in production (use `db:generate`/`db:migrate`).

## 6. Data model additions (delta on top of existing `users` table)

New tables (Drizzle, `enableRLS()` on all):

- `roles` or a Postgres enum `role` (`super_admin | admin | editor | viewer`) added to `users`.
- `education` (userId FK, institution, degree, gpa, startDate, endDate, notes, sortOrder)
- `experiences` (userId FK, title, organization, type: work|training, startDate, endDate, description, sortOrder)
- `certifications` (userId FK, title, issuer, imageUrl, verifyUrl, issuedAt, sortOrder)
- `skills` (userId FK, name, category, sortOrder) — normalizes the current `users.skills` text array, or keep the array for "headline skills" and add this table for the categorized skills section (decide during `ARCHITECTURE.md` review)
- `projects` (userId FK, title, description, repoUrl, liveUrl, imageUrl, source: manual|github, sortOrder, featured boolean)
- `articles` (authorId FK, slug, title, excerpt, contentMd, coverImageUrl, status: draft|published, publishedAt, createdAt, updatedAt)
- `article_tags` + `article_tags_on_articles` (many-to-many) or a simple `tags text[]` on `articles` for v1
- All content tables get `deletedAt timestamp` (soft-delete, matching the `crud-rbac-django` convention) instead of hard deletes.

## 7. Feature → branch mapping

See `AGENTS.md` §"Branching model" for the exact naming rule. Summary:

| Branch | Scope |
|---|---|
| `feature/schema-rbac` | Role enum/column, `roles` if separate table, RLS policies, seed script for the first `SUPER_ADMIN` |
| `feature/auth` | Login, session, logout, argon2 hashing, middleware route guard |
| `feature/admin-shell` | `/dashboard` layout, role-aware nav, empty states |
| `feature/profile-about` | F2/A4 |
| `feature/education-experience` | F3/F4/A5 |
| `feature/certifications` | F5/A6 (incl. Supabase Storage upload) |
| `feature/skills` | F6/A7 |
| `feature/projects` | F7/A8 (incl. GitHub API sync job) |
| `feature/articles` | F9/A9 |
| `feature/contact-cv` | F8 |
| `feature/user-management` | A10 |
| `feature/design-system` | Tailwind theme tokens, shadcn setup per `DESIGN_SYSTEM.md` |

Each feature branch should be independently reviewable and only touch the tables/routes it owns; `feature/schema-rbac` merges first since everything else depends on the role column and RLS baseline.

## 8. Open questions

- Rich text vs Markdown for articles? (Markdown is simpler to store/diff and pairs well with `contentMd`.)
- Is `VIEWER`/comments in scope for v1, or deferred to phase 2? Affects whether public sign-up exists at all.
- GitHub sync: cron/revalidation-triggered fetch vs on-demand fetch at request time with caching?
