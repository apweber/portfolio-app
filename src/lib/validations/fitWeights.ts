import { z } from "zod";

export const fitWeightsSchema = z
  .object({
    skillsWeight: z.int().min(0).max(100),
    salaryWeight: z.int().min(0).max(100),
    remoteWeight: z.int().min(0).max(100),
    locationWeight: z.int().min(0).max(100),
  })
  .refine(
    (d) =>
      d.skillsWeight + d.salaryWeight + d.remoteWeight + d.locationWeight === 100,
    { message: "Weights must sum to 100" }
  );

export type FitWeightsInput = z.infer<typeof fitWeightsSchema>;
