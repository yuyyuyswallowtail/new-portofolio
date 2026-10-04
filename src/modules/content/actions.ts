"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import {
  certificationSchema,
  educationSchema,
  experienceSchema,
  idSchema,
  projectSchema,
  skillSchema,
  updateCertificationSchema,
  updateEducationSchema,
  updateExperienceSchema,
  updateProjectSchema,
  updateSkillSchema,
} from "./schema";
import * as service from "./service";

function invalid(error?: string) {
  return { ok: false as const, error: error ?? "Input tidak valid." };
}
const idOk = (id: string) => idSchema.safeParse(id).success;
const dirOk = (d: string) => d === "up" || d === "down";

function refresh(dashboardPath: string) {
  revalidatePath(dashboardPath);
  revalidatePath("/");
}

// ---------- Education ----------

export async function createEducationAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = educationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.createEducation(user, parsed.data);
  if (result.ok) refresh("/dashboard/education");
  return result;
}

export async function updateEducationAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = updateEducationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.updateEducation(user, parsed.data);
  if (result.ok) refresh("/dashboard/education");
  return result;
}

export async function deleteEducationAction(id: string) {
  const user = await getCurrentUser();
  if (!idOk(id)) return invalid();
  const result = await service.deleteEducation(user, id);
  if (result.ok) refresh("/dashboard/education");
  return result;
}

export async function moveEducationAction(
  id: string,
  direction: "up" | "down",
) {
  const user = await getCurrentUser();
  if (!idOk(id) || !dirOk(direction)) return invalid();
  const result = await service.moveEducation(user, id, direction);
  if (result.ok) refresh("/dashboard/education");
  return result;
}

// ---------- Experience ----------

export async function createExperienceAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.createExperience(user, parsed.data);
  if (result.ok) refresh("/dashboard/experience");
  return result;
}

export async function updateExperienceAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = updateExperienceSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.updateExperience(user, parsed.data);
  if (result.ok) refresh("/dashboard/experience");
  return result;
}

export async function deleteExperienceAction(id: string) {
  const user = await getCurrentUser();
  if (!idOk(id)) return invalid();
  const result = await service.deleteExperience(user, id);
  if (result.ok) refresh("/dashboard/experience");
  return result;
}

// ---------- Certifications ----------

export async function createCertificationAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = certificationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.createCertification(user, parsed.data);
  if (result.ok) refresh("/dashboard/certifications");
  return result;
}

export async function updateCertificationAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = updateCertificationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.updateCertification(user, parsed.data);
  if (result.ok) refresh("/dashboard/certifications");
  return result;
}

export async function deleteCertificationAction(id: string) {
  const user = await getCurrentUser();
  if (!idOk(id)) return invalid();
  const result = await service.deleteCertification(user, id);
  if (result.ok) refresh("/dashboard/certifications");
  return result;
}

export async function moveCertificationAction(
  id: string,
  direction: "up" | "down",
) {
  const user = await getCurrentUser();
  if (!idOk(id) || !dirOk(direction)) return invalid();
  const result = await service.moveCertification(user, id, direction);
  if (result.ok) refresh("/dashboard/certifications");
  return result;
}

// ---------- Skills ----------

export async function createSkillAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.createSkill(user, parsed.data);
  if (result.ok) refresh("/dashboard/skills");
  return result;
}

export async function updateSkillAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = updateSkillSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.updateSkill(user, parsed.data);
  if (result.ok) refresh("/dashboard/skills");
  return result;
}

export async function deleteSkillAction(id: string) {
  const user = await getCurrentUser();
  if (!idOk(id)) return invalid();
  const result = await service.deleteSkill(user, id);
  if (result.ok) refresh("/dashboard/skills");
  return result;
}

export async function moveSkillAction(id: string, direction: "up" | "down") {
  const user = await getCurrentUser();
  if (!idOk(id) || !dirOk(direction)) return invalid();
  const result = await service.moveSkill(user, id, direction);
  if (result.ok) refresh("/dashboard/skills");
  return result;
}

// ---------- Projects ----------

export async function createProjectAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.createProject(user, parsed.data);
  if (result.ok) refresh("/dashboard/projects");
  return result;
}

export async function updateProjectAction(input: unknown) {
  const user = await getCurrentUser();
  const parsed = updateProjectSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const result = await service.updateProject(user, parsed.data);
  if (result.ok) refresh("/dashboard/projects");
  return result;
}

export async function deleteProjectAction(id: string) {
  const user = await getCurrentUser();
  if (!idOk(id)) return invalid();
  const result = await service.deleteProject(user, id);
  if (result.ok) refresh("/dashboard/projects");
  return result;
}

export async function moveProjectAction(id: string, direction: "up" | "down") {
  const user = await getCurrentUser();
  if (!idOk(id) || !dirOk(direction)) return invalid();
  const result = await service.moveProject(user, id, direction);
  if (result.ok) refresh("/dashboard/projects");
  return result;
}
