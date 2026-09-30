# CODE STYLE — Portofolio v2

## 1. Formatting & linting

- **Biome** is the single source of truth for formatting and linting (`biome.json`). Run `bun run lint` before pushing; `bun run format` to auto-fix. No Prettier/ESLint alongside it — don't add a second formatter.
- CI must run `biome check .` and fail the build on violations.

## 2. TypeScript

- `strict: true`. No `any` — use `unknown` + narrowing, or a proper generic, if the type is genuinely not known ahead of time.
- Prefer `type` for data shapes (props, DTOs), `interface` only when you need declaration merging (rare here).
- Infer Drizzle row/insert types from the schema (`typeof users.$inferSelect`, `$inferInsert`) rather than hand-writing parallel types that can drift from the schema.
- Zod schemas are the runtime validation boundary; derive static types from them with `z.infer<typeof schema>` wherever a validated shape is reused, instead of maintaining a duplicate hand-written type.

## 3. Naming conventions

| What | Convention | Example |
|---|---|---|
| React components | PascalCase, file name matches export | `ProjectCard.tsx` exporting `ProjectCard` |
| Hooks | camelCase, `use` prefix | `useArticleForm.ts` |
| Server actions | camelCase verb-first | `createArticle`, `publishArticle` |
| Service functions | camelCase verb-first | `getArticleBySlug`, `assertCanEdit` |
| Zustand stores | camelCase, `Store` suffix | `dashboardUiStore.ts` |
| DB tables | snake_case (Postgres), camelCase in Drizzle schema object keys | table `articles`, column `published_at` ↔ Drizzle `publishedAt` |
| Route groups | parenthesized, lowercase | `(dashboard)`, `(public)` |
| Zod schemas | camelCase, `Schema` suffix | `createArticleSchema` |

## 4. File organization

- One feature = one folder under `src/modules/<feature>/` with `service.ts`, `repository.ts`, `actions.ts`, `schema.ts` as needed (see `ARCHITECTURE.md` §2). Don't scatter a feature's logic across `app/` route files.
- Route files (`page.tsx`, route handlers) stay thin: parse params/searchParams, call a service/action, render. No direct Drizzle queries inside `app/**/page.tsx`.
- Shared UI primitives live in `components/ui/` (shadcn-generated, left mostly as-is); feature-composed components live next to the feature or in `components/<feature>/`.

## 5. Commits

- **Conventional Commits**, enforced by `commitlint` (already wired via husky):
  `type(scope): summary`, e.g. `feat(articles): add draft/publish toggle`, `fix(auth): expire session on logout`.
- Allowed types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`, `ci`.
- Scope = the feature folder or area (`auth`, `articles`, `rbac`, `design-system`, `db`, etc.) — matches the branch naming in §"Branching model" of `AGENTS.md`.
- One logical change per commit; don't bundle a schema migration with an unrelated UI tweak.

## 6. Server actions & error handling

- Every server action returns a discriminated result, not a thrown exception for expected failures:
  ```ts
  type ActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string };
  ```
  Reserve thrown errors for truly unexpected failures (DB connection down), which Next's error boundary should catch.
- Permission failures (`can()` returns false) return `{ ok: false, error: "forbidden" }` — never a silent no-op and never a stack trace leaked to the client.

## 7. Testing conventions

- Unit test services (`modules/<feature>/service.ts`) with the repository mocked — this is where `can()` permission logic and business rules live, and where bugs are cheapest to catch.
- Integration test RLS policies directly against a test Postgres instance (a role tries to touch a row it shouldn't; assert Postgres rejects it) — don't only test the service-layer check, since RLS is the backstop and needs its own coverage per `SECURITY.md`.
- Co-locate tests: `service.test.ts` next to `service.ts`.

## 8. Comments & documentation

- Comment *why*, not *what* — the code should read clearly enough that a `// loop through projects` comment is never needed.
- Any deviation from this file or from `ARCHITECTURE.md` (e.g. a route handler that has to touch Drizzle directly for a legitimate reason) gets a one-line comment explaining why, so a reviewer doesn't flag it as a mistake.
