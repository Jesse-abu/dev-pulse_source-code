import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post cannot be empty.")
    .max(1000, "Keep engineering notes under 1,000 characters."),
  codeSnippet: z
    .string()
    .max(4000, "Code snippet exceeds 4,000 characters.")
    .optional()
    .or(z.literal("")),
  language: z.string().trim().max(32).optional().or(z.literal("")),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;