import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  certifications,
  education,
  experiences,
  projects,
  skillEntries,
  users,
} from "@/db/schema";

export async function getOwnerProfile() {
  // Single-owner portfolio: the first staff user is treated as "the" profile.
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.role, "super_admin"))
    .orderBy(asc(users.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function listEducation(userId: string) {
  return db
    .select()
    .from(education)
    .where(and(eq(education.userId, userId), isNull(education.deletedAt)))
    .orderBy(asc(education.sortOrder), asc(education.createdAt));
}

export async function listExperiences(userId: string) {
  return db
    .select()
    .from(experiences)
    .where(and(eq(experiences.userId, userId), isNull(experiences.deletedAt)))
    .orderBy(asc(experiences.sortOrder));
}

export async function listCertifications(userId: string) {
  return db
    .select()
    .from(certifications)
    .where(
      and(eq(certifications.userId, userId), isNull(certifications.deletedAt)),
    )
    .orderBy(asc(certifications.sortOrder));
}

export async function listSkills(userId: string) {
  return db
    .select()
    .from(skillEntries)
    .where(and(eq(skillEntries.userId, userId), isNull(skillEntries.deletedAt)))
    .orderBy(asc(skillEntries.sortOrder));
}

export async function listProjects(userId: string) {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))
    .orderBy(asc(projects.sortOrder));
}

// ---------- Education (write) ----------

type EducationInsert = typeof education.$inferInsert;

export async function findEducation(id: string) {
  const rows = await db
    .select()
    .from(education)
    .where(and(eq(education.id, id), isNull(education.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function nextEducationSortOrder(userId: string) {
  const [row] = await db
    .select({
      max: sql<number>`coalesce(max(${education.sortOrder}), -1)::int`,
    })
    .from(education)
    .where(and(eq(education.userId, userId), isNull(education.deletedAt)));
  return (row?.max ?? -1) + 1;
}

export async function insertEducation(values: EducationInsert) {
  const [row] = await db.insert(education).values(values).returning();
  if (!row) throw new Error("Failed to insert education");
  return row;
}

export async function updateEducation(
  id: string,
  values: Partial<EducationInsert>,
) {
  const [row] = await db
    .update(education)
    .set(values)
    .where(and(eq(education.id, id), isNull(education.deletedAt)))
    .returning();
  return row ?? null;
}

export async function softDeleteEducation(id: string) {
  await db
    .update(education)
    .set({ deletedAt: new Date() })
    .where(eq(education.id, id));
}

/** Tulis ulang sort_order sesuai urutan id yang diberikan (0, 1, 2, ...). */
export async function setEducationOrder(ids: string[]) {
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (!id) continue;
    await db
      .update(education)
      .set({ sortOrder: i })
      .where(eq(education.id, id));
  }
}

// ---------- Shared write helpers ----------

export type ContentTable =
  | "education"
  | "experiences"
  | "certifications"
  | "skill_entries"
  | "projects";

export async function softDeleteContent(table: ContentTable, id: string) {
  await db.execute(
    sql`update ${sql.identifier(table)} set deleted_at = now() where id = ${id}`,
  );
}

/** Tulis ulang sort_order sesuai urutan id yang diberikan (0, 1, 2, ...). */
export async function setContentOrder(table: ContentTable, ids: string[]) {
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (!id) continue;
    await db.execute(
      sql`update ${sql.identifier(table)} set sort_order = ${i} where id = ${id}`,
    );
  }
}

// ---------- Experiences (write) ----------

type ExperienceInsert = typeof experiences.$inferInsert;

export async function insertExperience(values: ExperienceInsert) {
  const [row] = await db.insert(experiences).values(values).returning();
  if (!row) throw new Error("Failed to insert experience");
  return row;
}

export async function updateExperience(
  id: string,
  values: Partial<ExperienceInsert>,
) {
  const [row] = await db
    .update(experiences)
    .set(values)
    .where(and(eq(experiences.id, id), isNull(experiences.deletedAt)))
    .returning();
  return row ?? null;
}

// ---------- Certifications (write) ----------

type CertificationInsert = typeof certifications.$inferInsert;

export async function insertCertification(values: CertificationInsert) {
  const [row] = await db.insert(certifications).values(values).returning();
  if (!row) throw new Error("Failed to insert certification");
  return row;
}

export async function updateCertification(
  id: string,
  values: Partial<CertificationInsert>,
) {
  const [row] = await db
    .update(certifications)
    .set(values)
    .where(and(eq(certifications.id, id), isNull(certifications.deletedAt)))
    .returning();
  return row ?? null;
}

// ---------- Skills (write) ----------

type SkillInsert = typeof skillEntries.$inferInsert;

export async function insertSkill(values: SkillInsert) {
  const [row] = await db.insert(skillEntries).values(values).returning();
  if (!row) throw new Error("Failed to insert skill");
  return row;
}

export async function updateSkill(id: string, values: Partial<SkillInsert>) {
  const [row] = await db
    .update(skillEntries)
    .set(values)
    .where(and(eq(skillEntries.id, id), isNull(skillEntries.deletedAt)))
    .returning();
  return row ?? null;
}

// ---------- Projects (write) ----------

type ProjectInsert = typeof projects.$inferInsert;

export async function insertProject(values: ProjectInsert) {
  const [row] = await db.insert(projects).values(values).returning();
  if (!row) throw new Error("Failed to insert project");
  return row;
}

export async function updateProject(
  id: string,
  values: Partial<ProjectInsert>,
) {
  const [row] = await db
    .update(projects)
    .set(values)
    .where(and(eq(projects.id, id), isNull(projects.deletedAt)))
    .returning();
  return row ?? null;
}
