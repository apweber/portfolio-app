import { z } from "zod";

const workPreferenceEnum = z.enum(["REMOTE", "HYBRID", "ONSITE"]);
const applicationStatusEnum = z.enum([
  "APPLIED",
  "PHONE_SCREEN",
  "INTERVIEWING",
  "OFFER",
  "REJECTED",
]);

const salaryRefinement = <
  T extends { salaryRangeMin?: number | null; salaryRangeMax?: number | null },
>(
  data: T
) =>
  data.salaryRangeMin == null ||
  data.salaryRangeMax == null ||
  data.salaryRangeMin <= data.salaryRangeMax;

const salaryRefinementMessage = { message: "salaryRangeMin must be <= salaryRangeMax" };

const jobFields = z.object({
  companyId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  postingUrl: z.string().optional(),
  location: z.string().optional(),
  salaryRangeMin: z.int().min(0).nullable().optional(),
  salaryRangeMax: z.int().min(0).nullable().optional(),
  workPreference: workPreferenceEnum.nullable().optional(),
  status: applicationStatusEnum.default("APPLIED"),
  applicationDate: z.coerce.date().nullable().optional(),
  notes: z.string().optional(),
  requiredSkills: z.array(z.string()),
  tags: z.array(z.string()),
});

export const jobCreateSchema = jobFields.refine(salaryRefinement, salaryRefinementMessage);
export const jobUpdateSchema = jobFields.partial().refine(salaryRefinement, salaryRefinementMessage);

export const jobQuerySchema = z.object({
  status: applicationStatusEnum.optional(),
  tag: z.string().optional(),
  companyId: z.string().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  workPreference: workPreferenceEnum.optional(),
  sort: z.enum(["fitScore", "applicationDate", "company"]).default("fitScore"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type JobCreateInput = z.infer<typeof jobCreateSchema>;
export type JobUpdateInput = z.infer<typeof jobUpdateSchema>;
export type JobQueryInput = z.infer<typeof jobQuerySchema>;
