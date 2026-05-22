import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  targetSalary: z.int().min(0).nullable().optional(),
  workPreference: z.enum(["REMOTE", "HYBRID", "ONSITE"]).nullable().optional(),
  preferredLocation: z.string().nullable().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
