import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db/client";
import {
  certifications,
  education,
  experiences,
  projects,
  skillEntries,
  users,
} from "../src/db/schema";

/**
 * Seeds the real profile data for Bintang Mesir, sourced from the CV
 * (cv.pdf) and the old portfolio's README.md — see AGENTS.md if you're an
 * agent reading this: don't invent data here, only add what's verifiably
 * from those two sources or what the owner adds later via the dashboard.
 *
 * Run AFTER `bun run seed:admin` (needs the super_admin user row to exist).
 *
 * Idempotent: tiap bagian dilewati kalau user sudah punya baris di tabelnya,
 * jadi aman dijalankan berkali-kali dan tidak menimpa edit dari dashboard.
 * Untuk seed ulang dari nol: RESET=1 bun run seed:content
 * (hanya menghapus baris konten milik user ini, bukan users/articles/comments).
 */
const RESET = process.env.RESET === "1";

async function hasRows(query: Promise<unknown[]>): Promise<boolean> {
  return (await query).length > 0;
}

async function main() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    console.error("ADMIN_EMAIL not set in .env — run seed:admin first.");
    process.exit(1);
  }

  const [owner] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!owner) {
    console.error(
      `No user found for ${email} — run 'bun run seed:admin' first.`,
    );
    process.exit(1);
  }

  if (RESET) {
    console.log("RESET=1: menghapus konten lama milik user ini...");
    await db.delete(education).where(eq(education.userId, owner.id));
    await db.delete(experiences).where(eq(experiences.userId, owner.id));
    await db.delete(certifications).where(eq(certifications.userId, owner.id));
    await db.delete(skillEntries).where(eq(skillEntries.userId, owner.id));
    await db.delete(projects).where(eq(projects.userId, owner.id));
  }

  // ---------- Profile ----------
  if (RESET || !owner.bio) {
    await db
      .update(users)
      .set({
        name: "Bintang Mesir",
        phone: "+62 823 2197 3545",
        linkedinUrl: "https://linkedin.com/in/bintang-mesir",
        githubUsername: "yuyyuyswallowtail",
        profileUrl: "/profile.jpg",
        cvUrl: "/cv.pdf",
        bio: [
          "Saya memiliki pengalaman dalam pengembangan web melalui program Studi Independen Kampus Merdeka dan telah memperoleh Sertifikasi Kompetensi BNSP sebagai Software Engineering.",
          "Saya terbiasa merancang dan membangun aplikasi web modern, responsif, dan scalable dengan pendekatan Clean Code, REST API, serta prinsip Software Engineering yang baik.",
          "Minat utama: Full Stack Web Development, Frontend Development (React JS, Next.js), Backend Development (Express JS, Laravel, Golang Fiber), dan dasar-dasar Data Processing & Machine Learning.",
        ].join("\n\n"),
      })
      .where(eq(users.id, owner.id));
    console.log("profile: diisi");
  } else {
    console.log("profile: sudah ada, dilewati");
  }

  // ---------- Education (source: cv.pdf) ----------
  if (
    await hasRows(
      db
        .select()
        .from(education)
        .where(eq(education.userId, owner.id))
        .limit(1),
    )
  ) {
    console.log("education: sudah ada, dilewati");
  } else {
    await db.insert(education).values([
      {
        userId: owner.id,
        institution: "Universitas Muhammadiyah Jakarta",
        degree: "Sarjana Teknik Informatika",
        gpa: "3.67 / 4.00",
        startDate: "2020-10-01",
        endDate: "2024-10-01",
        notes:
          "Mata kuliah relevan: Perancangan Basis Data, Pemrograman Berorientasi Objek, Rekayasa Perangkat Lunak, Pemrograman Berbasis Web, Sistem Manajemen Basis Data.",
        sortOrder: 0,
      },
    ]);
    console.log("education: diisi");
  }

  // ---------- Experience — work + training (source: cv.pdf) ----------
  if (
    await hasRows(
      db
        .select()
        .from(experiences)
        .where(eq(experiences.userId, owner.id))
        .limit(1),
    )
  ) {
    console.log("experiences: sudah ada, dilewati");
  } else {
    await db.insert(experiences).values([
      {
        userId: owner.id,
        title: "Junior Web Developer (Fullstack Developer)",
        organization: "PT. Emco Digital Indonesia (Digitalindo)",
        type: "work",
        startDate: "2026-04-01",
        endDate: "2026-06-01",
        description:
          "Maintenance dan penambahan fitur sistem digitalindo logistics cargo dengan ticketing system menggunakan PHP, jQuery, MySQL, React, dan Node.js.",
        sortOrder: 0,
      },
      {
        userId: owner.id,
        title: "Web Developer (Fullstack Developer) — Magang",
        organization: "PT. Hacktivate Teknologi Indonesia (Hacktiv8)",
        type: "work",
        startDate: "2024-08-01",
        endDate: "2024-12-01",
        description:
          "Maintenance modul pembelajaran web menggunakan React JS, MySQL, dan Express.js; maintenance antarmuka web responsif dengan React JS dan Tailwind CSS.",
        sortOrder: 1,
      },
      {
        userId: owner.id,
        title: "Data Science (Web Developer) — Magang",
        organization: "PT. Hacktivate Teknologi Indonesia (Hacktiv8)",
        type: "work",
        startDate: "2023-02-01",
        endDate: "2023-06-01",
        description:
          "Proyek prediksi gagal jantung dengan model klasifikasi & ensemble; membangun antarmuka web menggunakan Flask dan Python.",
        sortOrder: 2,
      },
      {
        userId: owner.id,
        title: "Web Developer (Front End Developer) — Magang",
        organization: "PT. Ruang Raya Indonesia (Ruangguru)",
        type: "work",
        startDate: "2022-08-01",
        endDate: "2022-12-01",
        description:
          "Maintenance modul pembelajaran web menggunakan HTML, CSS, MongoDB, dan Golang; antarmuka responsif dengan React JS dan Tailwind CSS.",
        sortOrder: 3,
      },
      // ---------- Training (source: cv.pdf "PELATIHAN & SERTIFIKASI") ----------
      {
        userId: owner.id,
        title: "Sertifikasi Pelatihan Digitalent — React JS dan Node JS",
        organization: "Digital Talent Academy (Talenta Digital)",
        type: "training",
        startDate: "2026-03-01",
        endDate: "2026-12-01",
        description: null,
        sortOrder: 4,
      },
      {
        userId: owner.id,
        title: "Sertifikasi Pelatihan VSGA — PHP",
        organization: "Vocational School Graduate Academy (Digitalent)",
        type: "training",
        startDate: "2023-03-01",
        endDate: "2023-12-01",
        description: null,
        sortOrder: 5,
      },
      {
        userId: owner.id,
        title: "Sertifikasi Kompetensi BNSP — React JS dan Express JS",
        organization: "Badan Nasional Sertifikasi Profesi (BNSP)",
        type: "training",
        startDate: "2023-07-01",
        endDate: "2026-07-01",
        description: null,
        sortOrder: 6,
      },
    ]);
    console.log("experiences: diisi");
  }

  // ---------- Certifications (source: public/certificates/*.jpg from old repo) ----------
  if (
    await hasRows(
      db
        .select()
        .from(certifications)
        .where(eq(certifications.userId, owner.id))
        .limit(1),
    )
  ) {
    console.log("certifications: sudah ada, dilewati");
  } else {
    await db.insert(certifications).values([
      ...Array.from({ length: 8 }, (_, i) => ({
        userId: owner.id,
        title: "Sertifikat Pelatihan — Digital Talent Academy",
        issuer: "Digital Talent Academy (Kominfo)",
        imageUrl: `/certificates/DTA-${i + 1}.jpg`,
        sortOrder: i,
      })),
      {
        userId: owner.id,
        title: "Hacktiv8 — Certificate of Completion",
        issuer: "Hacktiv8 (PT. Hacktivate Teknologi Indonesia)",
        imageUrl: "/certificates/hacktiv8.jpg",
        sortOrder: 8,
      },
      {
        userId: owner.id,
        title: "Ruangguru — Certificate of Completion",
        issuer: "PT. Ruang Raya Indonesia (Ruangguru)",
        imageUrl: "/certificates/ruangguru.jpg",
        sortOrder: 9,
      },
      {
        userId: owner.id,
        title: "Vocational School Graduate Academy (VSGA) — PHP",
        issuer: "Digitalent / VSGA",
        imageUrl: "/certificates/vsga.jpg",
        sortOrder: 10,
      },
    ]);
    console.log("certifications: diisi");
  }

  // ---------- Skills (source: cv.pdf + README.md "Technical Skills") ----------
  if (
    await hasRows(
      db
        .select()
        .from(skillEntries)
        .where(eq(skillEntries.userId, owner.id))
        .limit(1),
    )
  ) {
    console.log("skills: sudah ada, dilewati");
  } else {
    const skillGroups: Record<string, string[]> = {
      Languages: ["JavaScript", "TypeScript", "PHP", "Python", "Golang"],
      Frontend: [
        "HTML",
        "CSS",
        "React.js",
        "Next.js",
        "Tailwind CSS",
        "Bootstrap",
        "jQuery",
      ],
      Backend: ["Node.js", "Express.js", "Laravel", "Golang Fiber", "Flask"],
      Database: ["MySQL", "PostgreSQL", "Supabase", "MongoDB"],
    };
    let skillSort = 0;
    const skillRows = Object.entries(skillGroups).flatMap(
      ([category, names]) =>
        names.map((name) => ({
          userId: owner.id,
          name,
          category,
          sortOrder: skillSort++,
        })),
    );
    await db.insert(skillEntries).values(skillRows);
    console.log("skills: diisi");
  }

  // ---------- Projects (source: cv.pdf "PROJEK" + github.com/yuyyuyswallowtail repos) ----------
  if (
    await hasRows(
      db
        .select()
        .from(projects)
        .where(eq(projects.userId, owner.id))
        .limit(1),
    )
  ) {
    console.log("projects: sudah ada, dilewati");
  } else {
    await db.insert(projects).values([
      {
        userId: owner.id,
        title: "Progimedia — Emco Digital Indonesia",
        description:
          "Aplikasi website company profile & sistem internal. PHP, jQuery, Bootstrap, MySQL.",
        source: "manual",
        sortOrder: 0,
      },
      {
        userId: owner.id,
        title: "Company Profile — Infinity Fish Indonesia",
        description:
          "Aplikasi company profile. Next.js dan Supabase PostgreSQL.",
        source: "manual",
        sortOrder: 1,
      },
      {
        userId: owner.id,
        title: "Sistem Santunan Anak Yatim",
        description:
          "Aplikasi pengelolaan santunan. React JS, Golang Fiber, MySQL.",
        source: "manual",
        sortOrder: 2,
      },
      {
        userId: owner.id,
        title: "Website Himpunan HMIF BEM FT-UMJ",
        description:
          "Website organisasi himpunan mahasiswa. React JS, Golang Fiber, MySQL.",
        source: "manual",
        sortOrder: 3,
      },
      {
        userId: owner.id,
        title: "Perpustakaan Digital",
        description:
          "Aplikasi perpustakaan digital. Flask, Jinja, jQuery, Bootstrap, MySQL.",
        source: "manual",
        sortOrder: 4,
      },
      {
        userId: owner.id,
        title: "portofolio",
        description:
          "Versi sebelumnya dari portfolio ini — personal portfolio website.",
        repoUrl: "https://github.com/yuyyuyswallowtail/portofolio",
        liveUrl: "https://portofolio-bintang-mesir.vercel.app",
        source: "github",
        featured: true,
        sortOrder: 5,
      },
      {
        userId: owner.id,
        title: "pokedex",
        description: "Pokedex API, dibuat dengan Next.js dan Framer Motion.",
        repoUrl: "https://github.com/yuyyuyswallowtail/pokedex",
        liveUrl: "https://pokedex-bintang-mesir.vercel.app",
        source: "github",
        sortOrder: 6,
      },
    ]);
    console.log("projects: diisi");
  }

  console.log("Selesai.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
