import { z } from "zod";

export const companyCreateSchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional(),
  size: z.string().optional(),
  location: z.string().optional(),
  website: z.url().optional(),
  cultureNotes: z.string().optional(),
});

export const companyUpdateSchema = companyCreateSchema.partial();

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
