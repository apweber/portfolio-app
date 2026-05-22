import { z } from "zod";

const proficiencyEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]);

export const skillCreateSchema = z.object({
  name: z.string().min(1),
  proficiency: proficiencyEnum,
});

export const skillUpdateSchema = z.object({
  proficiency: proficiencyEnum,
});

export type SkillCreateInput = z.infer<typeof skillCreateSchema>;
export type SkillUpdateInput = z.infer<typeof skillUpdateSchema>;
