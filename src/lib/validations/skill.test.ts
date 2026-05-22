import { describe, it, expect } from "vitest";
import { skillCreateSchema, skillUpdateSchema } from "@/lib/validations/skill";

describe("skillCreateSchema", () => {
  it("accepts a valid skill", () => {
    const result = skillCreateSchema.safeParse({ name: "TypeScript", proficiency: "ADVANCED" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = skillCreateSchema.safeParse({ name: "", proficiency: "BEGINNER" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing name", () => {
    const result = skillCreateSchema.safeParse({ proficiency: "INTERMEDIATE" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid proficiency", () => {
    const result = skillCreateSchema.safeParse({ name: "Go", proficiency: "MASTER" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid proficiency levels", () => {
    for (const p of ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const) {
      expect(skillCreateSchema.safeParse({ name: "x", proficiency: p }).success).toBe(true);
    }
  });
});

describe("skillUpdateSchema", () => {
  it("accepts a valid proficiency", () => {
    expect(skillUpdateSchema.safeParse({ proficiency: "EXPERT" }).success).toBe(true);
  });

  it("rejects an invalid proficiency", () => {
    expect(skillUpdateSchema.safeParse({ proficiency: "NONE" }).success).toBe(false);
  });

  it("rejects a missing proficiency", () => {
    expect(skillUpdateSchema.safeParse({}).success).toBe(false);
  });
});
