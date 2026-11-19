import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(60, "Display name must be 60 characters or fewer."),
  bio: z
    .string()
    .trim()
    .max(240, "Bio must be 240 characters or fewer."),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;