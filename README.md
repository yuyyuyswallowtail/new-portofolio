# Bintang Mesir — Software Engineer & Web Developer

Lulusan S1 Teknik Informatika dari Universitas Muhammadiyah Jakarta, bersertifikat
Kompetensi BNSP sebagai Software Engineer. Portfolio + blog dengan RBAC, admin
dashboard lengkap (sidebar, analytics, WYSIWYG editor, AI article generation +
regenerate, comments), dan auto-generate artikel terjadwal.

📧 bintangmsr@gmail.com · 🔗 [linkedin.com/in/bintang-mesir](https://linkedin.com/in/bintang-mesir) · 🐙 [github.com/yuyyuyswallowtail](https://github.com/yuyyuyswallowtail)

---

## Stack

Next.js 16 · Drizzle + Postgres (RLS) · Tiptap (WYSIWYG) · Three.js + Framer Motion ·
Gemini 3.8 Flash + 3.1 Flash Image · Docker Compose (app + db + cron)

## What's new in this round

- **Contact folded into the global footer** (every page), no longer a separate
  nav item/page. Staff login link lives in the footer too (small, not in main nav).
- **Admin sidebar** (replacing the old top nav) — Overview/Articles/Profile/Users/System.
- **WYSIWYG editor (Tiptap)** for articles — bold/italic/headings/lists/quote/code/link,
  **multiple image uploads** inline in the content, plus a separate **cover/thumbnail**
  upload field. Uploads go to `public/uploads/articles/` (persisted via the
  `uploads_data` Docker volume).
- **Article edit page** (`/dashboard/articles/[id]/edit`) — every article now has a
  proper Edit flow, not just Publish/Delete. AI-generated articles also get a
  **"Regenerate with AI"** button where you describe what to fix and Gemini rewrites
  the draft in place.
- AI-generated drafts now redirect straight to the edit page after generation, so
  review/edit is the natural next step instead of an extra click.
- **Comments** on published articles — public name+message form (honeypot +
  rate-limited anti-spam), staff can delete from the article page itself.
- Article content is now stored as **sanitized HTML** (Tiptap's native format) instead
  of raw Markdown — AI-generated Markdown is converted once at save time. Proper
  `@tailwindcss/typography` styling (`prose`) fixes paragraph spacing; article page is
  now responsive on mobile (nav got a hamburger menu too — it had none before).
- **Favicon** (`src/app/icon.svg`) — the old repo only had Next.js's default one.
- Hero + Projects section visually elevated (bigger display type, image-forward
  project cards) — still not a pixel-perfect clone of any reference site, but a clear
  step up from the plain version.
- **Bug fix:** a malformed/stale session cookie used to crash every page with a 500
  (Postgres rejecting an invalid UUID). Now treated as "logged out", as it should be.
- `seed:admin` defaults: `bintangmsr@gmail.com` / `20200410700101` (change
  `ADMIN_PASSWORD` in `.env` before running in anything but local dev).
- Profile page can now edit **email** too (uniqueness-checked).

## Quick start (Docker)

```bash
cd portofolio
cp .env.example .env   # fill GEMINI_API_KEY, change CRON_SECRET + ADMIN_PASSWORD
docker compose up --build -d
docker compose exec -T db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < src/db/policies.sql
docker compose exec app bun run seed:admin
docker compose exec app bun run seed:content
```

Open http://localhost:3000. Staff login is at `/login` (linked quietly from the
footer, not the main nav — see `SECURITY.md`).

## Docs

`PRD.md`, `ARCHITECTURE.md`, `SECURITY.md`, `DESIGN_SYSTEM.md`, `CODE_STYLE.md`,
`AGENTS.md` — still reflect an earlier state of the project (pre-dashboard,
pre-auto-generate, pre-this-round). The code has moved faster than the docs across
the last few rounds; happy to reconcile them in a dedicated pass if useful.

## Still not done (said plainly, not buried)

- GitHub repo auto-sync for Projects
- Dashboard CRUD for education/experience/certifications/skills (data model +
  repository exist in `src/modules/content/`, no write-side UI yet)
- Comment moderation is delete-only (no pending/approve queue)
- Automated tests
