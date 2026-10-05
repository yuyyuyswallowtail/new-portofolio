# DESIGN SYSTEM — Portofolio v3

## 1. Direction

Situs publik memakai bahasa visual "agency-style" yang terinspirasi pola wearedirect.co (hanya pola gaya, bukan aset/teks): tipografi hero sangat besar, blok warna solid, label bernomor, tombol pil, strip berjalan, akordeon, kartu statistik, dan footer dengan wordmark raksasa. Isinya tetap portfolio engineer: strip berjalan berisi skill, bukan logo klien; tidak ada testimoni palsu.

Dashboard (`/dashboard/*`) sengaja tetap memakai gaya instrumen v2 (kartu hairline, radius 6px, aksen teal) — jangan memakai blok warna atau tombol pil di sana.

## 2. Color

Token netral v2 tetap berlaku di dua tema (`--bg`, `--surface`, `--ink`, `--ink-muted`, `--line`, `--accent`, `--accent-strong`, `--warn`, `--danger`).

Token baru khusus situs publik, sama di tema terang dan gelap:

| Token | Hex | Kelas |
|---|---|---|
| `--block-yellow` | `#FFC21A` | `bg-block-yellow` |
| `--block-blue` | `#3B82FF` | `bg-block-blue` |
| `--block-green` | `#7BE08A` | `bg-block-green` |
| `--block-pink` | `#FF9AE0` | `bg-block-pink` |
| `--block-red` | `#FF6A5C` | `bg-block-red` |
| `--on-block` | `#0B0D10` | `text-on-block` |

Aturan: teks di atas blok warna selalu `text-on-block` (hitam), tidak pernah `text-ink`, supaya kontras tetap lulus di kedua tema. Warna blok bergilir lewat `blockClass(i)` di `components/site/blocks.ts`.

## 3. Typography

- Inter 400–800 untuk semua teks; IBM Plex Mono untuk data dan label (`font-data`, `.kicker`, `.chip`).
- `.display-xl` (nama di hero), `.display-lg` (judul section, angka statistik), judul kartu 24–30px, body 17px.
- Label section berformat `NN / KICKER` dalam mono huruf besar (`SectionHeading`).

## 4. Components (public)

- `.pill`, `.pill-solid`, `.pill-accent`, `.pill-outline`, `.pill-sm`: semua tombol/CTA situs publik. Jangan memakai `Button` dashboard di sini.
- `.chip`: tag kecil berborder (source project, tipe experience, tag artikel).
- Kartu besar: radius 28px (project, statistik, CTA footer), 24px (artikel), 20px (sertifikat).
- `Marquee`, `Accordion` (skills), `ArticleCard`, `SectionHeading`.

## 5. Motion

Reveal-on-scroll hanya untuk blok section (bukan tiap elemen). Marquee berhenti saat hover. Hover kartu: gambar zoom 105%, tombol pil naik 2px. Semua animasi mengikuti `prefers-reduced-motion`.

## 6. Accessibility

- Kontras teks di blok: hitam di atas kuning/hijau/pink/merah/biru lulus AA.
- Akordeon: `aria-expanded`, `aria-controls`, dan panel tertutup memakai `inert`.
- Marquee dan wordmark footer dekoratif (`aria-hidden`).
- Fokus: ring `--accent` pada semua tombol dan link interaktif.
