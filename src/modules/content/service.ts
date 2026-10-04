import "server-only";
import { logger } from "@/lib/logger";
import { can, type Role } from "@/lib/rbac";
import * as repo from "./repository";
import type {
  CertificationInput,
  EducationInput,
  ExperienceInput,
  ProjectInput,
  SkillInput,
  UpdateCertificationInput,
  UpdateEducationInput,
  UpdateExperienceInput,
  UpdateProjectInput,
  UpdateSkillInput,
} from "./schema";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
type CurrentUser = { id: string; role: Role } | null;
type Direction = "up" | "down";

const NOT_FOUND = { ok: false as const, error: "Data tidak ditemukan." };

/** Cek izin + ambil owner portfolio (data selalu atas nama owner). */
async function context(user: CurrentUser) {
  if (!user || !can(user.role, "content.manage")) {
    return {
      ok: false as const,
      error: "Kamu tidak punya izin mengelola konten.",
    };
  }
  const owner = await repo.getOwnerProfile();
  if (!owner) {
    return { ok: false as const, error: "Profil owner tidak ditemukan." };
  }
  return { ok: true as const, user, owner };
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function nextSort(rows: { sortOrder: number }[]): number {
  return rows.reduce((max, r) => Math.max(max, r.sortOrder), -1) + 1;
}

async function removeItem(
  user: CurrentUser,
  table: repo.ContentTable,
  list: (ownerId: string) => Promise<{ id: string }[]>,
  id: string,
): Promise<ActionResult<null>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await list(ctx.owner.id);
  if (!rows.some((r) => r.id === id)) return NOT_FOUND;
  await repo.softDeleteContent(table, id);
  logger.info("content_deleted", { table, itemId: id, userId: ctx.user.id });
  return { ok: true, data: null };
}

async function moveItem(
  user: CurrentUser,
  table: repo.ContentTable,
  list: (ownerId: string) => Promise<{ id: string }[]>,
  id: string,
  direction: Direction,
): Promise<ActionResult<null>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await list(ctx.owner.id);
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return NOT_FOUND;

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return { ok: true, data: null };

  const ids = rows.map((r) => r.id);
  const [moved] = ids.splice(index, 1);
  if (!moved) return NOT_FOUND;
  ids.splice(target, 0, moved);
  await repo.setContentOrder(table, ids);
  return { ok: true, data: null };
}

// ---------- Education ----------

export async function createEducation(
  user: CurrentUser,
  input: EducationInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await repo.listEducation(ctx.owner.id);
  const row = await repo.insertEducation({
    userId: ctx.owner.id,
    institution: input.institution.trim(),
    degree: clean(input.degree),
    gpa: clean(input.gpa),
    startDate: clean(input.startDate),
    endDate: clean(input.endDate),
    notes: clean(input.notes),
    sortOrder: nextSort(rows),
  });
  logger.info("education_created", {
    educationId: row.id,
    userId: ctx.user.id,
  });
  return { ok: true, data: { id: row.id } };
}

export async function updateEducation(
  user: CurrentUser,
  input: UpdateEducationInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await repo.listEducation(ctx.owner.id);
  if (!rows.some((r) => r.id === input.id)) return NOT_FOUND;
  const row = await repo.updateEducation(input.id, {
    institution: input.institution.trim(),
    degree: clean(input.degree),
    gpa: clean(input.gpa),
    startDate: clean(input.startDate),
    endDate: clean(input.endDate),
    notes: clean(input.notes),
  });
  if (!row) return NOT_FOUND;
  logger.info("education_updated", {
    educationId: row.id,
    userId: ctx.user.id,
  });
  return { ok: true, data: { id: row.id } };
}

export const deleteEducation = (user: CurrentUser, id: string) =>
  removeItem(user, "education", repo.listEducation, id);
export const moveEducation = (user: CurrentUser, id: string, d: Direction) =>
  moveItem(user, "education", repo.listEducation, id, d);

// ---------- Experience ----------

export async function createExperience(
  user: CurrentUser,
  input: ExperienceInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await repo.listExperiences(ctx.owner.id);
  const row = await repo.insertExperience({
    userId: ctx.owner.id,
    title: input.title.trim(),
    organization: input.organization.trim(),
    type: input.type,
    startDate: clean(input.startDate),
    endDate: clean(input.endDate),
    description: clean(input.description),
    sortOrder: nextSort(rows),
  });
  logger.info("experience_created", {
    experienceId: row.id,
    userId: ctx.user.id,
  });
  return { ok: true, data: { id: row.id } };
}

export async function updateExperience(
  user: CurrentUser,
  input: UpdateExperienceInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await repo.listExperiences(ctx.owner.id);
  if (!rows.some((r) => r.id === input.id)) return NOT_FOUND;
  const row = await repo.updateExperience(input.id, {
    title: input.title.trim(),
    organization: input.organization.trim(),
    type: input.type,
    startDate: clean(input.startDate),
    endDate: clean(input.endDate),
    description: clean(input.description),
  });
  if (!row) return NOT_FOUND;
  logger.info("experience_updated", {
    experienceId: row.id,
    userId: ctx.user.id,
  });
  return { ok: true, data: { id: row.id } };
}

export const deleteExperience = (user: CurrentUser, id: string) =>
  removeItem(user, "experiences", repo.listExperiences, id);

// ---------- Certifications ----------

export async function createCertification(
  user: CurrentUser,
  input: CertificationInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await repo.listCertifications(ctx.owner.id);
  const row = await repo.insertCertification({
    userId: ctx.owner.id,
    title: input.title.trim(),
    issuer: input.issuer.trim(),
    imageUrl: clean(input.imageUrl),
    verifyUrl: clean(input.verifyUrl),
    issuedAt: clean(input.issuedAt),
    sortOrder: nextSort(rows),
  });
  logger.info("certification_created", {
    certificationId: row.id,
    userId: ctx.user.id,
  });
  return { ok: true, data: { id: row.id } };
}

export async function updateCertification(
  user: CurrentUser,
  input: UpdateCertificationInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await repo.listCertifications(ctx.owner.id);
  if (!rows.some((r) => r.id === input.id)) return NOT_FOUND;
  const row = await repo.updateCertification(input.id, {
    title: input.title.trim(),
    issuer: input.issuer.trim(),
    imageUrl: clean(input.imageUrl),
    verifyUrl: clean(input.verifyUrl),
    issuedAt: clean(input.issuedAt),
  });
  if (!row) return NOT_FOUND;
  logger.info("certification_updated", {
    certificationId: row.id,
    userId: ctx.user.id,
  });
  return { ok: true, data: { id: row.id } };
}

export const deleteCertification = (user: CurrentUser, id: string) =>
  removeItem(user, "certifications", repo.listCertifications, id);
export const moveCertification = (
  user: CurrentUser,
  id: string,
  d: Direction,
) => moveItem(user, "certifications", repo.listCertifications, id, d);

// ---------- Skills ----------

export async function createSkill(
  user: CurrentUser,
  input: SkillInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await repo.listSkills(ctx.owner.id);
  const row = await repo.insertSkill({
    userId: ctx.owner.id,
    name: input.name.trim(),
    category: clean(input.category),
    sortOrder: nextSort(rows),
  });
  logger.info("skill_created", { skillId: row.id, userId: ctx.user.id });
  return { ok: true, data: { id: row.id } };
}

export async function updateSkill(
  user: CurrentUser,
  input: UpdateSkillInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await repo.listSkills(ctx.owner.id);
  if (!rows.some((r) => r.id === input.id)) return NOT_FOUND;
  const row = await repo.updateSkill(input.id, {
    name: input.name.trim(),
    category: clean(input.category),
  });
  if (!row) return NOT_FOUND;
  logger.info("skill_updated", { skillId: row.id, userId: ctx.user.id });
  return { ok: true, data: { id: row.id } };
}

export const deleteSkill = (user: CurrentUser, id: string) =>
  removeItem(user, "skill_entries", repo.listSkills, id);
export const moveSkill = (user: CurrentUser, id: string, d: Direction) =>
  moveItem(user, "skill_entries", repo.listSkills, id, d);

// ---------- Projects ----------

export async function createProject(
  user: CurrentUser,
  input: ProjectInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await repo.listProjects(ctx.owner.id);
  const row = await repo.insertProject({
    userId: ctx.owner.id,
    title: input.title.trim(),
    description: clean(input.description),
    repoUrl: clean(input.repoUrl),
    liveUrl: clean(input.liveUrl),
    imageUrl: clean(input.imageUrl),
    featured: input.featured,
    sortOrder: nextSort(rows),
  });
  logger.info("project_created", { projectId: row.id, userId: ctx.user.id });
  return { ok: true, data: { id: row.id } };
}

export async function updateProject(
  user: CurrentUser,
  input: UpdateProjectInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await context(user);
  if (!ctx.ok) return ctx;
  const rows = await repo.listProjects(ctx.owner.id);
  if (!rows.some((r) => r.id === input.id)) return NOT_FOUND;
  const row = await repo.updateProject(input.id, {
    title: input.title.trim(),
    description: clean(input.description),
    repoUrl: clean(input.repoUrl),
    liveUrl: clean(input.liveUrl),
    imageUrl: clean(input.imageUrl),
    featured: input.featured,
  });
  if (!row) return NOT_FOUND;
  logger.info("project_updated", { projectId: row.id, userId: ctx.user.id });
  return { ok: true, data: { id: row.id } };
}

export const deleteProject = (user: CurrentUser, id: string) =>
  removeItem(user, "projects", repo.listProjects, id);
export const moveProject = (user: CurrentUser, id: string, d: Direction) =>
  moveItem(user, "projects", repo.listProjects, id, d);
