# SECURITY — Portofolio v2

## 1. Authentication

- **Password storage:** `password` (hash) + `salt`, computed with `@node-rs/argon2` (Argon2id). Never store or log the plaintext password. Never move to a single `passwordHash` column that embeds the salt unless you also migrate existing rows — this is a deliberate schema choice already made (see `/areas/portofolio.md`), keep it consistent.
- **No public self-registration for staff roles.** The only way to get `admin`/`editor` is: (a) the bootstrap `super_admin` seed script run once at setup, or (b) an invite created by `super_admin` from the user-management screen (A10 in `PRD.md`). If `VIEWER`/public accounts (for comments) ship later, that flow is separate and explicitly cannot self-elevate to a staff role — enforce this in the service layer, not just the UI.
- **Login rate limiting:** limit failed attempts per email + per IP (e.g. exponential backoff or a fixed lockout window) to blunt credential stuffing/brute force. Implement in the `auth` service, not middleware, so it can see the identity being targeted.
- **Session:** DB-backed session table (see `ARCHITECTURE.md` §8), httpOnly + `Secure` + `SameSite=Lax` cookie, short-ish absolute expiry with sliding renewal on activity, and a real logout that deletes the session row (not just clears the cookie client-side).

## 2. Authorization (RBAC) — defense in depth

Three layers, all required, none optional:

1. **Middleware (`middleware.ts`)** — coarse gate: is there a valid session at all for any `(dashboard)` route. Cheap, runs on the edge, first line of defense.
2. **Service layer (`lib/rbac.ts#can(user, action, resource)`)** — the actual authorization decision. Every server action/mutation calls this before touching the repository. One function, one source of truth for the permission matrix in `PRD.md` §4 — do not reimplement role checks ad hoc in individual actions.
3. **Postgres RLS policy** — the backstop. Written assuming the application layer *will* have a bug someday; a policy like "an `editor` can only update `articles` rows where `author_id = current_user_id()` and `status != 'published'` unless role is admin/super_admin" should hold even if the service-layer check is skipped by a future contributor.

**Rule:** if you can't express a permission rule as an RLS policy, that's a signal the role/table design needs review — don't rely on "the app will always call the service layer correctly" as your only control.

## 3. Input validation

- Every server action and API route validates input with a `zod` schema **before** it reaches the service layer. Reuse the same schema on the client for `react-hook-form`'s resolver so client and server never drift.
- Treat all `contentMd` (article Markdown) as untrusted: sanitize/escape on render (if any HTML rendering step is introduced, e.g. via a Markdown-to-HTML pipeline) to prevent stored XSS from a compromised or malicious editor account.
- File uploads (certification images, profile photo, CV PDF) — validate MIME type and size server-side (not just via the `<input accept>` attribute, which is only a UI hint), and store them in Supabase Storage with a bucket policy, not as arbitrary public write.

## 4. Secrets & environment

- `.env.local` only, never committed (`.env.example` stays a template with empty values, as it already is).
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` are server-only — never imported into a client component or exposed via `NEXT_PUBLIC_*`. Only `NEXT_PUBLIC_SUPABASE_URL` and the publishable/anon key are safe client-side.
- Database credentials (`DATABASE_URL`, `DIRECT_URL`) are server-only, used exclusively by the Drizzle client in `db/client.ts`.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` if it is ever pasted into a chat, ticket, or log by mistake — treat it like a password, not a config value.

## 5. Transport & headers

- HTTPS-only (Vercel default). Set `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and a reasonable `Content-Security-Policy` in `next.config.ts` headers — especially important once Markdown-rendered article content is on the page.
- CSRF: Next.js server actions include origin-checking by default; still avoid `GET` requests with side effects, and avoid handling raw form posts in `app/api/*` routes without an equivalent check.

## 6. Dependency & build hygiene

- `biome check .` in CI (see `CODE_STYLE.md`) plus `bun pm audit` (or `npm audit` equivalent) as part of the pipeline before merge to `main`/`develop`.
- Pin exact versions for security-sensitive packages (`@node-rs/argon2`, `postgres`, `drizzle-orm`) rather than loose ranges once the project stabilizes.

## 7. Threat model summary (STRIDE-lite)

| Threat | Mitigation |
|---|---|
| Credential stuffing / brute force login | Rate limiting + lockout, argon2 (slow hash) |
| Session hijacking | httpOnly/Secure/SameSite cookies, short expiry, DB-revocable sessions |
| Privilege escalation (editor → admin) | `can()` centralized check + RLS policy per role, no client-trusted role flags |
| Stored XSS via article content | Sanitize rendered Markdown, CSP |
| SSRF/abuse via GitHub sync job | Restrict outbound calls to the GitHub API only, validate/allowlist the configured username |
| Data exposure via misconfigured RLS | RLS enabled on every table by default (`enableRLS()`), explicit policy per table, deny-by-default |
| Secret leakage | Server-only env vars, `.env.example` never holds real values, key rotation on suspected exposure |
| Unauthorized file upload / storage abuse | Server-side MIME/size validation, scoped Supabase Storage bucket policy |

## 8. Open questions

- Should failed-login lockout be per-account, per-IP, or both? Recommend both, with the per-IP window shorter/looser to avoid locking out a whole office network.
- Decide and document the exact CSP directives once the article-rendering pipeline (which Markdown renderer, whether raw HTML is ever allowed) is chosen.
