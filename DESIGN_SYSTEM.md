# DESIGN SYSTEM — Portofolio v2

## 1. Direction

The subject is a backend/systems engineer whose actual daily work is precise, structural, and a little unglamorous by design: RBAC matrices, layered services, running LLM inference under hardware constraints. The design should read like the site of someone who builds instrumentation, not someone selling a SaaS. Concretely: **avoid** the cream+serif+terracotta "AI portfolio" default, the near-black+neon-accent default, and the identical-rounded-card SaaS kit — none of those are about this subject.

Direction: a **technical-instrument** aesthetic — think an oscilloscope readout or a well-kept engineering notebook, not a marketing site. Grid-true layout, a working (non-decorative) monospace used specifically for data (dates, versions, tags, repo names), and a restrained, cool palette so the one accent color (used for links/CTAs/status) actually stands out.

## 2. Color

Named tokens (light mode first; dark mode is the primary intended mode given the subject, light is the fallback):

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0E1116` (dark) / `#F7F8FA` (light) | Page background |
| `--surface` | `#151A21` (dark) / `#FFFFFF` (light) | Cards, panels |
| `--ink` | `#E7EBF0` (dark) / `#131720` (light) | Primary text |
| `--ink-muted` | `#8B95A3` | Secondary text, metadata |
| `--line` | `#232A34` (dark) / `#E3E6EA` (light) | Borders, dividers |
| `--accent` | `#4FD1B5` (a signal-teal, like an active status LED) | Links, primary CTA, active nav, focus ring |
| `--accent-strong` | `#2FAF95` | Hover/pressed state of accent |
| `--warn` | `#E0A741` | Draft status, warnings |
| `--danger` | `#E0616B` | Destructive actions |

Only one accent hue is "loud" (`--accent`). Everything else is deliberately quiet so the accent keeps its meaning: it always means "actionable" or "live/published," never decoration.

## 3. Typography

- **Body/UI face:** a humanist sans with real personality but high legibility at small sizes — e.g. **Inter** or **IBM Plex Sans** — used for all prose, nav, and form UI.
- **Data/label face:** a real monospace — e.g. **IBM Plex Mono** or **JetBrains Mono** — used *functionally*, not decoratively: dates in the education/experience timeline, article publish dates, tag chips, repo names, version numbers in the footer. If a piece of text isn't actually data, it doesn't get the monospace treatment (no monospace-as-vibe on headings).
- **Scale** (a fifth/major-third-ish progression, not a generic Tailwind default stack):

| Role | Size / Line-height |
|---|---|
| Display (hero name) | 56px / 1.05 |
| H1 (page/section title) | 34px / 1.15 |
| H2 (subsection) | 24px / 1.25 |
| Body | 17px / 1.6 |
| Small / metadata | 14px / 1.5 (often in the mono face) |

- Line length: cap article/body prose at ~72ch.
- No single-word accent-color/italic emphasis inside headlines (that's on the "generic AI design" list to avoid) — if something needs emphasis, restructure the sentence or use weight, not color, inside body copy.

## 4. Layout

- Left-aligned, grid-true layout for the public site (not centered-hero-with-everything-centered-below, which is the generic default). A visible content column with a slightly wider "data rail" for metadata (dates, tags) sitting to the right of prose on desktop — this literalizes the "instrument readout" idea: content on the left, structured data on the right.
- ASCII sketch of the home page:

```
┌───────────────────────────────────────────────┐
│  [logo/mark]                    Projects Articles Contact │
├───────────────────────────────────────────────┤
│  Yuyyuy                                        │
│  Backend & local-inference engineer            │  <- hero, left-aligned
│  [view projects]  [download cv]                │
├───────────────────────────────────────────────┤
│  About            │  domicile · availability    │  <- data rail, mono
│  (prose, ≤72ch)    │  skills: [tag][tag][tag]    │
├───────────────────────────────────────────────┤
│  Experience & training           2020 ── now    │  <- timeline, vertical rule
│  ├─ role, org                     mono dates    │
│  └─ role, org                                   │
├───────────────────────────────────────────────┤
│  Certifications        [img] [img] [img] [img]  │
├───────────────────────────────────────────────┤
│  Projects   [card] [card] [card]   (source: gh/manual badge, mono) │
├───────────────────────────────────────────────┤
│  Articles   list, date + tags in mono, title in sans │
└───────────────────────────────────────────────┘
```

- Section dividers are hairline rules (`--line`), not shadowed cards — cards are reserved for genuinely repeated, browsable units (project cards, certification tiles, article list items), never used as a default wrapper for every section.
- Border radius: small and consistent where used (project/article cards) — 6px, not the generic "everything is rounded-2xl" look. Timeline and data rail elements are square/hairline, not rounded, to keep the "instrument" read distinct from the "card" read.

## 5. Motion

One deliberate moment: on first load, the hero name and role line in with a short, single fade/slide (≤ 250ms), nothing else animates on load. Section reveals on scroll are **not** used (that's the generic "fade-in-on-every-section" tell). Hover states exist only where they communicate something real: a project card lifts a hairline border to `--accent` on hover (signals "clickable/live"), a nav link underlines from the caret side, form field focus rings use `--accent`. Respect `prefers-reduced-motion` — disable the load-in animation entirely when set.

## 6. Components (shadcn / Base UI)

- Use shadcn/Base UI primitives unmodified for behavior (dialogs, dropdowns, forms) — only restyle via the tokens above, not by writing parallel one-off components.
- Status badges (article draft/published, project source manual/github) use the mono face + a small dot indicator in `--accent`/`--warn`/`--ink-muted`, not colored pill backgrounds — keeps with the "instrument" read (status lights, not marketing tags).
- Buttons: one primary style (filled `--accent`, dark text for contrast), one secondary (outline, `--line` border), no third "ghost everywhere" variant used as a default — ghost buttons only inside dense toolbars (dashboard).

## 7. Accessibility floor

- Contrast: body text against `--bg`/`--surface` must hit WCAG AA (4.5:1) in both themes — verify `--ink-muted` specifically, it's the one most likely to fail.
- All interactive elements have a visible focus ring using `--accent`, including in dark mode.
- Timeline and data-rail information must not be color-only — pair the accent dot with text (e.g. "Published" label next to the dot), not the dot alone.
- `prefers-reduced-motion` disables the hero load-in.

## 8. Implementation notes

- Define tokens as CSS variables in `globals.css` under `:root` and a `.dark`/`[data-theme="dark"]` block, then map them into `tailwind.config`/Tailwind v4 theme tokens so `bg-surface`, `text-ink`, `border-line`, `text-accent` etc. are available as utility classes — don't hardcode hex values in components.
- Keep the monospace face restricted via a utility (e.g. a `font-data` class) so it's easy to grep for "is this actually data" during review.
