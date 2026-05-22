import { describe, it, expect } from "vitest";
import { profileUpdateSchema } from "@/lib/validations/profile";

describe("profileUpdateSchema", () => {
  it("accepts a fully populated valid update", () => {
    const result = profileUpdateSchema.safeParse({
      name: "Alice",
      targetSalary: 120000,
      workPreference: "REMOTE",
      preferredLocation: "San Francisco",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (all fields optional for PATCH)", () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = profileUpdateSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative targetSalary", () => {
    const result = profileUpdateSchema.safeParse({ targetSalary: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid workPreference", () => {
    const result = profileUpdateSchema.safeParse({ workPreference: "WORK_FROM_HOME" });
    expect(result.success).toBe(false);
  });

  it("accepts null for nullable fields", () => {
    const result = profileUpdateSchema.safeParse({
      targetSalary: null,
      workPreference: null,
      preferredLocation: null,
    });
    expect(result.success).toBe(true);
  });
});
