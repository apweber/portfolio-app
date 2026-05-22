import { describe, it, expect } from "vitest";
import { jobCreateSchema, jobUpdateSchema, jobQuerySchema } from "@/lib/validations/job";

const validJob = {
  companyId: "cmp_123",
  title: "Software Engineer",
  description: "A great role",
  postingUrl: "https://example.com/job",
  location: "Remote",
  salaryRangeMin: 100000,
  salaryRangeMax: 150000,
  workPreference: "REMOTE",
  status: "APPLIED",
  applicationDate: "2026-01-15",
  notes: "Looks promising",
  requiredSkills: ["TypeScript", "React"],
  tags: ["startup", "series-b"],
};

describe("jobCreateSchema", () => {
  it("accepts a fully populated valid job", () => {
    expect(jobCreateSchema.safeParse(validJob).success).toBe(true);
  });

  it("accepts a minimal job (companyId + title + empty arrays)", () => {
    const result = jobCreateSchema.safeParse({
      companyId: "cmp_1",
      title: "Engineer",
      requiredSkills: [],
      tags: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing companyId", () => {
    const { companyId: _, ...rest } = validJob;
    expect(jobCreateSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(jobCreateSchema.safeParse({ ...validJob, title: "" }).success).toBe(false);
  });

  it("rejects salaryRangeMin > salaryRangeMax", () => {
    const result = jobCreateSchema.safeParse({
      ...validJob,
      salaryRangeMin: 200000,
      salaryRangeMax: 100000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("salaryRangeMin must be <= salaryRangeMax");
    }
  });

  it("accepts when only one salary bound is set", () => {
    expect(jobCreateSchema.safeParse({ ...validJob, salaryRangeMax: null }).success).toBe(true);
    expect(jobCreateSchema.safeParse({ ...validJob, salaryRangeMin: null }).success).toBe(true);
  });

  it("rejects an invalid status", () => {
    expect(jobCreateSchema.safeParse({ ...validJob, status: "GHOSTED" }).success).toBe(false);
  });

  it("defaults status to APPLIED when omitted", () => {
    const { status: _, ...rest } = validJob;
    const result = jobCreateSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("APPLIED");
  });

  it("coerces applicationDate from a string", () => {
    const result = jobCreateSchema.safeParse({ ...validJob, applicationDate: "2026-03-01" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.applicationDate).toBeInstanceOf(Date);
  });

  it("accepts null for nullable fields", () => {
    expect(
      jobCreateSchema.safeParse({ ...validJob, salaryRangeMin: null, applicationDate: null, workPreference: null }).success
    ).toBe(true);
  });
});

describe("jobUpdateSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    expect(jobUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("still validates salary refinement when both bounds provided", () => {
    const result = jobUpdateSchema.safeParse({ salaryRangeMin: 300000, salaryRangeMax: 100000 });
    expect(result.success).toBe(false);
  });

  it("accepts a partial update", () => {
    expect(jobUpdateSchema.safeParse({ title: "Senior Engineer", status: "INTERVIEWING" }).success).toBe(true);
  });
});

describe("jobQuerySchema", () => {
  it("accepts an empty query and applies defaults", () => {
    const result = jobQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe("fitScore");
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("coerces page and limit from strings", () => {
    const result = jobQuerySchema.safeParse({ page: "2", limit: "50" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects an invalid sort value", () => {
    expect(jobQuerySchema.safeParse({ sort: "salary" }).success).toBe(false);
  });

  it("accepts valid sort values", () => {
    for (const sort of ["fitScore", "applicationDate", "company"] as const) {
      expect(jobQuerySchema.safeParse({ sort }).success).toBe(true);
    }
  });

  it("coerces minScore and maxScore from strings", () => {
    const result = jobQuerySchema.safeParse({ minScore: "30", maxScore: "80" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minScore).toBe(30);
      expect(result.data.maxScore).toBe(80);
    }
  });

  it("rejects a score outside 0-100", () => {
    expect(jobQuerySchema.safeParse({ minScore: "150" }).success).toBe(false);
  });
});
