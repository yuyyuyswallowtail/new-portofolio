import { and, asc, eq, isNull } from "drizzle-orm";
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
    .orderBy(asc(education.sortOrder));
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
