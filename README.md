# Bintang Mesir — Software Engineer & Web Developer

Portfolio + blog dengan RBAC, admin dashboard (sidebar, analytics, WYSIWYG editor,
AI article generation, comments), dan auto-generate artikel terjadwal.

📧 bintangmsr@gmail.com · 🔗 [linkedin.com/in/bintang-mesir](https://linkedin.com/in/bintang-mesir) · 🐙 [github.com/yuyyuyswallowtail](https://github.com/yuyyuyswallowtail)

---

## Stack

Next.js 16 · Bun · Drizzle ORM + Postgres (RLS) · Supabase (Postgres + Storage) ·
Tiptap (WYSIWYG) · Three.js + Rapier + Framer Motion · Gemini (model dikonfigurasi lewat env) ·
Deploy: Vercel

## Fitur

- **Home (design v2):** hero dengan lanyard 3D interaktif dan efek layar CRT, section
  bertumpuk (stacked), navbar sticky dengan efek kaca, galeri sertifikat horizontal,
  footer dengan tema terbalik dan ornamen komputer retro.
- **Artikel:** editor Tiptap, upload gambar inline + cover, edit/regenerate dengan AI,
  komentar publik (honeypot + rate limit) dengan moderasi.
- **Dashboard:** sidebar yang bisa di-collapse, analytics, manajemen artikel, komentar,
  profil, pengguna, dan konten portfolio.
- **Auth:** session cookie, RBAC (super_admin/admin/editor/viewer), RLS di Postgres.
- **Auto-generate artikel** terjadwal lewat endpoint cron.

## Development lokal

```bash
bun install
cp .env.example .env.local   # isi sesuai bagian "Environment variables"
bun run db:migrate
psql "$DIRECT_URL" -f src/db/policies.sql
bun run seed:admin
bun run seed:content
bun run dev
```

Buka http://localhost:3000. Login staff ada di `/login` (tautannya kecil di footer,
lihat `SECURITY.md`).

## Environment variables

| Variable | Keterangan |
| --- | --- |
| `DATABASE_URL` | Supabase pooler, port **6543** (transaction mode). Dipakai aplikasi saat runtime |
| `DIRECT_URL` | Supabase pooler, port **5432** (session mode). Dipakai migrasi dan seed |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Hanya server. Dipakai untuk upload ke Storage |
| `SUPABASE_BUCKET` | Nama bucket Storage, mis. `uploads` |
| `SESSION_COOKIE_NAME` | Default `portofolio_session` |
| `SESSION_TTL_DAYS` | Default `7` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Dipakai `seed:admin`. Ganti password default |
| `CRON_SECRET` | String acak panjang untuk melindungi endpoint cron |
| `GEMINI_API_KEY` | Dari https://aistudio.google.com/app/apikey |
| `GEMINI_TEXT_MODEL` | Mis. `gemini-3.5-flash-lite` |
| `GEMINI_TEXT_FALLBACK_MODELS` | Daftar model cadangan, dipisah koma |
| `GEMINI_IMAGE_ENABLED` | `true` / `false` |

Jangan pernah commit `.env` atau `.env.local`. Hanya variabel berawalan `NEXT_PUBLIC_`
yang boleh sampai ke browser. Service role key dan secret key harus tetap di server.

## Deploy ke Vercel + Supabase

Filesystem Vercel bersifat read-only dan tidak persisten, jadi upload tidak bisa lagi
ditulis ke `public/uploads/`. Semua upload (cover, gambar artikel, foto profil, CV)
disimpan di **Supabase Storage**.

### 1. Buat project Supabase

1. Buat project di https://supabase.com/dashboard, pilih region terdekat (mis. Singapore).
2. Buka **Connect** dan salin dua connection string pooler:
   - **Transaction pooler** (port 6543) untuk `DATABASE_URL`
   - **Session pooler** (port 5432) untuk `DIRECT_URL`
3. Buka **Settings → API** dan salin Project URL serta service role key.

### 2. Siapkan database

Jalankan dari mesin lokal dengan `.env.local` yang menunjuk ke Supabase:

```bash
bun run db:migrate
psql "$DIRECT_URL" -f src/db/policies.sql
bun run seed:admin
bun run seed:content
```

Alternatif untuk `policies.sql`: tempel isinya di **SQL Editor** Supabase.

Catatan driver: pooler transaction mode tidak mendukung prepared statements. Pada
`postgres` (postgres-js), buat client dengan `postgres(url, { prepare: false })`.

### 3. Siapkan Storage

1. Buka **Storage → New bucket**, beri nama `uploads`, centang **Public bucket**
   (gambar artikel perlu bisa dibaca publik). Batas upload 4MB karena limit body Vercel.
2. Upload dilakukan dari server memakai service role key, jadi tidak perlu policy
   tulis untuk anon.
3. Pindahkan aset yang sudah ada di `public/certificates`, `public/profile.jpg`, dan
   `public/cv.pdf` ke bucket jika ingin dikelola dari dashboard, lalu perbarui URL-nya
   di data profil/sertifikat.

URL publik objek berbentuk:

```
https://<project-ref>.supabase.co/storage/v1/object/public/uploads/<path>
```

`next.config.ts` otomatis mengizinkan host dari `NEXT_PUBLIC_SUPABASE_URL` untuk `next/image`. Contoh konfigurasinya:

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "<project-ref>.supabase.co", pathname: "/storage/v1/object/public/**" },
  ],
},
```

### 4. Deploy

1. Push repo ke GitHub, lalu **Add New → Project** di Vercel dan impor repo-nya.
2. Framework otomatis terdeteksi sebagai Next.js.
3. Isi semua variabel di bagian "Environment variables" pada **Settings → Environment
   Variables** (Production dan Preview). Jangan isi `ADMIN_PASSWORD` dengan nilai
   default.
4. Klik **Deploy**.
5. Setelah selesai, buka `https://<domain>/login` dan masuk dengan akun dari `seed:admin`.

Dengan Vercel CLI:

```bash
bunx vercel link
bunx vercel env pull .env.local
bunx vercel --prod
```

### 5. Cron untuk auto-generate artikel

Container `cron` di Docker tidak dipakai di Vercel. Gunakan Vercel Cron lewat `vercel.json`:

```json
{
  "crons": [{ "path": "/api/cron/generate-article", "schedule": "0 2 * * *" }]
}
```

Vercel mengirim `GET` dengan header `Authorization: Bearer <CRON_SECRET>` jika
`CRON_SECRET` diisi. Route `/api/cron/generate-article` menerima header itu, dan juga
`POST` dengan `x-cron-secret` untuk Docker. Jadwal ada di `vercel.json`. Di plan Hobby, cron hanya boleh berjalan sekali sehari, dan satu eksekusi dibatasi
durasi function. Generate gambar AI yang lambat bisa melewati batas itu, jadi biarkan
`GEMINI_IMAGE_ENABLED=false` jika terjadi timeout.

### Checklist setelah deploy

- [ ] Login `/login` berhasil dan password admin sudah diganti
- [ ] Upload cover dan gambar artikel muncul setelah redeploy
- [ ] Gambar sertifikat dan profil tampil di home
- [ ] Endpoint cron menolak request tanpa secret
- [ ] `DATABASE_URL` memakai port 6543, `DIRECT_URL` memakai port 5432

## Alternatif: Docker Compose (self-host)

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec -T db sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f -' < src/db/policies.sql
docker compose exec app bun run seed:admin
docker compose exec app bun run seed:content
```

Mode ini menyimpan upload di volume `uploads_data` (`public/uploads/`).

## Docs

`PRD.md`, `ARCHITECTURE.md`, `SECURITY.md`, `DESIGN_SYSTEM.md`, `CODE_STYLE.md`,
`AGENTS.md`. Sebagian masih mencerminkan kondisi lama project dan perlu disinkronkan.

## Belum selesai

- Sinkronisasi otomatis project dari GitHub
- Test otomatis
- Moderasi komentar tingkat lanjut
