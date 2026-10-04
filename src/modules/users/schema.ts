import { z } from "zod";

export const createStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8, "Minimal 8 karakter"),
  role: z.enum(["admin", "editor"]), // super_admin is bootstrap-only, see SECURITY.md §1
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["super_admin", "admin", "editor", "viewer"]),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const toggleActiveSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});
export type ToggleActiveInput = z.infer<typeof toggleActiveSchema>;
