import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(3).max(200),
  excerpt: z.string().max(300).optional(),
  contentMd: z.string().min(10),
  tags: z.array(z.string()).max(8).default([]),
  coverImageUrl: z.string().optional(),
});
export type CreateArticleInput = z.infer<typeof createArticleSchema>;

export const updateArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(200),
  excerpt: z.string().max(300).optional(),
  contentMd: z.string().min(10),
  tags: z.array(z.string()).max(8).default([]),
  coverImageUrl: z.string().optional(),
});
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;

export const regenerateSchema = z.object({
  id: z.string().uuid(),
  feedback: z.string().min(3).max(1000),
});
export type RegenerateInput = z.infer<typeof regenerateSchema>;

export const generateArticleSchema = z.object({
  topic: z.string().max(200).optional(),
  withImage: z.boolean().default(true),
});
export type GenerateArticleInput = z.infer<typeof generateArticleSchema>;

export const listQuerySchema = z.object({
  q: z.string().max(100).trim().optional(),
  tag: z.string().max(50).trim().optional(),
  status: z.enum(["draft", "published"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
export type ListQueryInput = z.infer<typeof listQuerySchema>;
