import { describe, it, expect } from "vitest";
import { fitWeightsSchema } from "@/lib/validations/fitWeights";

describe("fitWeightsSchema", () => {
  it("accepts weights that sum to exactly 100", () => {
    const result = fitWeightsSchema.safeParse({
      skillsWeight: 40,
      salaryWeight: 30,
      remoteWeight: 20,
      locationWeight: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects weights that sum to 95", () => {
    const result = fitWeightsSchema.safeParse({
      skillsWeight: 40,
      salaryWeight: 25,
      remoteWeight: 20,
      locationWeight: 10,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Weights must sum to 100");
    }
  });

  it("rejects weights that sum to 105", () => {
    const result = fitWeightsSchema.safeParse({
      skillsWeight: 45,
      salaryWeight: 30,
      remoteWeight: 20,
      locationWeight: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a weight above 100", () => {
    const result = fitWeightsSchema.safeParse({
      skillsWeight: 101,
      salaryWeight: 0,
      remoteWeight: 0,
      locationWeight: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative weight", () => {
    const result = fitWeightsSchema.safeParse({
      skillsWeight: -1,
      salaryWeight: 51,
      remoteWeight: 25,
      locationWeight: 25,
    });
    expect(result.success).toBe(false);
  });

  it("requires all four fields", () => {
    const result = fitWeightsSchema.safeParse({ skillsWeight: 100 });
    expect(result.success).toBe(false);
  });
});
