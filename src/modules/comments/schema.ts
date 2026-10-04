import { z } from "zod";

export const createCommentSchema = z.object({
  articleId: z.string().uuid(),
  authorName: z.string().min(2).max(80),
  authorEmail: z.string().email().optional().or(z.literal("")),
  body: z.string().min(2).max(2000),
  // Honeypot — browser asli tidak pernah mengisinya (disembunyikan), bot yang
  // mengisi semua field biasanya iya. Lolos validasi di sini supaya service
  // bisa pura-pura sukses, bukan mengembalikan error yang membocorkan jebakan.
  website: z.string().max(200).optional(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const commentIdsSchema = z.array(z.string().uuid()).min(1).max(100);
export const commentStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "spam",
]);
export const updateCommentBodySchema = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(2, "Komentar minimal 2 karakter").max(2000),
});
