import { z } from "zod";

export const idSchema = z.string().uuid();

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
  .or(z.literal(""))
  .optional();

function datesInOrder(d: { startDate?: string; endDate?: string }) {
  return !d.startDate || !d.endDate || d.endDate >= d.startDate;
}
const dateOrderIssue = {
  message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
  path: ["endDate"],
};

const educationFields = z.object({
  institution: z
    .string()
    .trim()
    .min(2, "Nama institusi minimal 2 karakter")
    .max(200),
  degree: z.string().max(200).optional(),
  gpa: z.string().max(20).optional(),
  startDate: dateString,
  endDate: dateString,
  notes: z.string().max(2000).optional(),
});

export const educationSchema = educationFields.refine(
  datesInOrder,
  dateOrderIssue,
);
export const updateEducationSchema = educationFields
  .extend({ id: z.string().uuid() })
  .refine(datesInOrder, dateOrderIssue);

export type EducationInput = z.infer<typeof educationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;

// ---------- shared field validators ----------

const assetUrl = z
  .string()
  .max(500)
  .refine(
    (v) =>
      v === "" ||
      (v.startsWith("/") && !v.startsWith("//")) ||
      /^https?:\/\//.test(v),
    "URL gambar tidak valid",
  )
  .optional();

const optionalUrl = z
  .string()
  .url("URL tidak valid")
  .or(z.literal(""))
  .optional();

// ---------- Experience ----------

const experienceFields = z.object({
  title: z.string().trim().min(2, "Judul minimal 2 karakter").max(200),
  organization: z
    .string()
    .trim()
    .min(2, "Organisasi minimal 2 karakter")
    .max(200),
  type: z.enum(["work", "training"]),
  startDate: dateString,
  endDate: dateString,
  description: z.string().max(4000).optional(),
});

export const experienceSchema = experienceFields.refine(
  datesInOrder,
  dateOrderIssue,
);
export const updateExperienceSchema = experienceFields
  .extend({ id: z.string().uuid() })
  .refine(datesInOrder, dateOrderIssue);

export type ExperienceInput = z.infer<typeof experienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;

// ---------- Certification ----------

const certificationFields = z.object({
  title: z.string().trim().min(2, "Judul minimal 2 karakter").max(200),
  issuer: z.string().trim().min(2, "Penerbit minimal 2 karakter").max(200),
  imageUrl: assetUrl,
  verifyUrl: optionalUrl,
  issuedAt: dateString,
});

export const certificationSchema = certificationFields;
export const updateCertificationSchema = certificationFields.extend({
  id: z.string().uuid(),
});

export type CertificationInput = z.infer<typeof certificationSchema>;
export type UpdateCertificationInput = z.infer<
  typeof updateCertificationSchema
>;

// ---------- Skill ----------

const skillFields = z.object({
  name: z.string().trim().min(1, "Nama skill wajib diisi").max(100),
  category: z.string().trim().max(100).optional(),
});

export const skillSchema = skillFields;
export const updateSkillSchema = skillFields.extend({ id: z.string().uuid() });

export type SkillInput = z.infer<typeof skillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;

// ---------- Project ----------

const projectFields = z.object({
  title: z.string().trim().min(2, "Judul minimal 2 karakter").max(200),
  description: z.string().max(2000).optional(),
  repoUrl: optionalUrl,
  liveUrl: optionalUrl,
  imageUrl: assetUrl,
  featured: z.boolean(),
});

export const projectSchema = projectFields;
export const updateProjectSchema = projectFields.extend({
  id: z.string().uuid(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
