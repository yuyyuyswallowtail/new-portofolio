export type SkillLogo = {
  /** Nama skill persis seperti di tabel skill_entries.name */
  name: string;
  /** Nama file di public/skills (tanpa .png) */
  file: string;
  /** Kandidat folder di Devicon, dicoba berurutan */
  devicon: string[];
  /** Kandidat slug di Simple Icons (cadangan) */
  simple?: string[];
};

/** Ukuran PNG (px x px). Cukup kecil: tile tampil sekitar 48px, 128px masih tajam di layar retina. */
export const LOGO_SIZE = 128;

export const LOGOS: SkillLogo[] = [
  { name: "JavaScript", file: "javascript", devicon: ["javascript"] },
  { name: "TypeScript", file: "typescript", devicon: ["typescript"] },
  { name: "PHP", file: "php", devicon: ["php"] },
  { name: "Python", file: "python", devicon: ["python"] },
  { name: "Golang", file: "golang", devicon: ["go"] },
  { name: "HTML", file: "html", devicon: ["html5"] },
  { name: "CSS", file: "css", devicon: ["css3"] },
  { name: "React.js", file: "react", devicon: ["react"] },
  { name: "Next.js", file: "nextjs", devicon: ["nextjs"] },
  { name: "Tailwind CSS", file: "tailwindcss", devicon: ["tailwindcss"] },
  { name: "Bootstrap", file: "bootstrap", devicon: ["bootstrap"] },
  { name: "jQuery", file: "jquery", devicon: ["jquery"] },
  { name: "Node.js", file: "nodejs", devicon: ["nodejs"] },
  { name: "Express.js", file: "express", devicon: ["express"] },
  { name: "Laravel", file: "laravel", devicon: ["laravel"] },
  {
    name: "Golang Fiber",
    file: "fiber",
    devicon: ["fiber", "gofiber"],
    simple: ["gofiber", "fiber"],
  },
  { name: "Flask", file: "flask", devicon: ["flask"] },
  { name: "MySQL", file: "mysql", devicon: ["mysql"] },
  { name: "PostgreSQL", file: "postgresql", devicon: ["postgresql"] },
  { name: "Supabase", file: "supabase", devicon: ["supabase"] },
  { name: "MongoDB", file: "mongodb", devicon: ["mongodb"] },
];
