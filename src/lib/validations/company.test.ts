import { describe, it, expect } from "vitest";
import { companyCreateSchema, companyUpdateSchema } from "@/lib/validations/company";

describe("companyCreateSchema", () => {
  it("accepts a valid full company", () => {
    const result = companyCreateSchema.safeParse({
      name: "Acme Corp",
      industry: "Software",
      size: "100-500",
      location: "San Francisco",
      website: "https://acme.example.com",
      cultureNotes: "Great WLB",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a company with only a name", () => {
    expect(companyCreateSchema.safeParse({ name: "Acme" }).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(companyCreateSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects a missing name", () => {
    expect(companyCreateSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an invalid website URL", () => {
    const result = companyCreateSchema.safeParse({
      name: "Acme",
      website: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid https website URL", () => {
    const result = companyCreateSchema.safeParse({
      name: "Acme",
      website: "https://acme.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("companyUpdateSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    expect(companyUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("rejects an empty name when provided", () => {
    expect(companyUpdateSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects an invalid website when provided", () => {
    expect(companyUpdateSchema.safeParse({ website: "bad-url" }).success).toBe(false);
  });
});
