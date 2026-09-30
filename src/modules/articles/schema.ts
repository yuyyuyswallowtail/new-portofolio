import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(3).max(200),
  excerpt: z.string().max(300).optional(),
  contentMd: z.string().min(10),
  tags: z.array(z.string()).max(8).default([]),
  coverImageUrl: z.string().optional(),
});
export type CreateArticleInput = z.infer<typeof createArticleSchema>;

export const generateArticleSchema = z.object({
  topic: z.string().max(200).optional(),
  withImage: z.boolean().default(true),
});
export type GenerateArticleInput = z.infer<typeof generateArticleSchema>;
