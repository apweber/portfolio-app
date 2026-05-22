import { describe, it, expect } from "vitest";
import {
  skillsScore,
  salaryScore,
  remoteScore,
  locationScore,
  calculateFitScore,
  type FitInput,
} from "@/lib/fit-score/calculate";

// ─── skillsScore ───────────────────────────────────────────────────────────────

describe("skillsScore", () => {
  it("returns 100 when required list is empty", () => {
    expect(skillsScore([{ name: "TypeScript", proficiency: "EXPERT" }], [])).toBe(100);
  });

  it("returns 0 when none of the required skills are matched", () => {
    expect(skillsScore([{ name: "Go", proficiency: "EXPERT" }], ["TypeScript", "React"])).toBe(0);
  });

  it("returns 100 for full match when all required skills are EXPERT", () => {
    const user = [
      { name: "TypeScript", proficiency: "EXPERT" as const },
      { name: "React", proficiency: "EXPERT" as const },
    ];
    expect(skillsScore(user, ["TypeScript", "React"])).toBe(100);
  });

  it("weights EXPERT at 1.0", () => {
    const user = [{ name: "Go", proficiency: "EXPERT" as const }];
    // 1.0 / 1 * 100 = 100
    expect(skillsScore(user, ["Go"])).toBe(100);
  });

  it("weights ADVANCED at 0.9", () => {
    const user = [{ name: "Go", proficiency: "ADVANCED" as const }];
    // 0.9 / 1 * 100 = 90
    expect(skillsScore(user, ["Go"])).toBe(90);
  });

  it("weights INTERMEDIATE at 0.75", () => {
    const user = [{ name: "Go", proficiency: "INTERMEDIATE" as const }];
    // 0.75 / 1 * 100 = 75
    expect(skillsScore(user, ["Go"])).toBe(75);
  });

  it("weights BEGINNER at 0.5", () => {
    const user = [{ name: "Go", proficiency: "BEGINNER" as const }];
    // 0.5 / 1 * 100 = 50
    expect(skillsScore(user, ["Go"])).toBe(50);
  });

  it("partial match: one of two required skills matched at ADVANCED", () => {
    const user = [{ name: "TypeScript", proficiency: "ADVANCED" as const }];
    // matched: 0.9; unmatched: 0; score = 0.9/2*100 = 45
    expect(skillsScore(user, ["TypeScript", "React"])).toBe(45);
  });

  it("partial match: two of three required at mixed proficiency", () => {
    const user = [
      { name: "TypeScript", proficiency: "INTERMEDIATE" as const },
      { name: "React", proficiency: "BEGINNER" as const },
    ];
    // (0.75 + 0.5) / 3 * 100 = 1.25/3*100 ≈ 41.67 → 42
    expect(skillsScore(user, ["TypeScript", "React", "Node"])).toBe(42);
  });

  it("matches skills case-insensitively", () => {
    const user = [{ name: "typescript", proficiency: "EXPERT" as const }];
    expect(skillsScore(user, ["TypeScript"])).toBe(100);
  });

  it("matches required skills case-insensitively", () => {
    const user = [{ name: "React", proficiency: "EXPERT" as const }];
    expect(skillsScore(user, ["REACT"])).toBe(100);
  });

  it("ignores extra user skills not in required list", () => {
    const user = [
      { name: "TypeScript", proficiency: "EXPERT" as const },
      { name: "Rust", proficiency: "EXPERT" as const },
    ];
    // only TypeScript required: 1.0/1*100 = 100
    expect(skillsScore(user, ["TypeScript"])).toBe(100);
  });
});

// ─── salaryScore ───────────────────────────────────────────────────────────────

describe("salaryScore", () => {
  it("returns 100 when target is null", () => {
    expect(salaryScore(null, 80000, 120000)).toBe(100);
  });

  it("returns 100 when min is null", () => {
    expect(salaryScore(100000, null, 120000)).toBe(100);
  });

  it("returns 100 when max is null", () => {
    expect(salaryScore(100000, 80000, null)).toBe(100);
  });

  it("returns 100 when all are null", () => {
    expect(salaryScore(null, null, null)).toBe(100);
  });

  it("returns 100 when target is within [min, max]", () => {
    expect(salaryScore(100000, 80000, 120000)).toBe(100);
  });

  it("returns 100 when target equals min", () => {
    expect(salaryScore(80000, 80000, 120000)).toBe(100);
  });

  it("returns 100 when target equals max", () => {
    expect(salaryScore(120000, 80000, 120000)).toBe(100);
  });

  it("returns 0 when target is below min", () => {
    expect(salaryScore(70000, 80000, 120000)).toBe(0);
  });

  it("returns 0 when target is far below min", () => {
    expect(salaryScore(10000, 80000, 120000)).toBe(0);
  });

  it("returns 0 when target is more than 20% above max", () => {
    // max=100, target=125 → 25% above → 0
    expect(salaryScore(125, 80, 100)).toBe(0);
  });

  it("returns 0 when target is exactly 20% above max", () => {
    // max=100, target=120 → exactly 20% → 0
    expect(salaryScore(120, 80, 100)).toBe(0);
  });

  it("returns 50 when target is 10% above max", () => {
    // max=100, target=110 → excess=0.1 → (1-0.1/0.2)*100 = 50
    expect(salaryScore(110, 80, 100)).toBe(50);
  });

  it("returns 75 when target is 5% above max", () => {
    // max=100, target=105 → excess=0.05 → (1-0.05/0.2)*100 = 75
    expect(salaryScore(105, 80, 100)).toBe(75);
  });

  it("returns 25 when target is 15% above max", () => {
    // max=100, target=115 → excess=0.15 → (1-0.15/0.2)*100 = 25
    expect(salaryScore(115, 80, 100)).toBe(25);
  });
});

// ─── remoteScore ───────────────────────────────────────────────────────────────

describe("remoteScore", () => {
  it.each([
    [null, "REMOTE", 100],
    ["REMOTE", null, 100],
    [null, null, 100],
    ["REMOTE", "REMOTE", 100],
    ["HYBRID", "HYBRID", 100],
    ["ONSITE", "ONSITE", 100],
    ["REMOTE", "HYBRID", 60],
    ["HYBRID", "REMOTE", 80],
    ["ONSITE", "REMOTE", 50],
    ["REMOTE", "ONSITE", 30],
    ["HYBRID", "ONSITE", 30],
    ["ONSITE", "HYBRID", 30],
  ] as const)(
    "user=%s job=%s → %i",
    (user, job, expected) => {
      expect(remoteScore(user, job)).toBe(expected);
    }
  );
});

// ─── locationScore ─────────────────────────────────────────────────────────────

describe("locationScore", () => {
  it("returns 100 when user location is null", () => {
    expect(locationScore(null, "New York")).toBe(100);
  });

  it("returns 100 when job location is null", () => {
    expect(locationScore("New York", null)).toBe(100);
  });

  it("returns 100 when both are null", () => {
    expect(locationScore(null, null)).toBe(100);
  });

  it("returns 100 for an exact match", () => {
    expect(locationScore("New York", "New York")).toBe(100);
  });

  it("returns 100 for a case-insensitive exact match", () => {
    expect(locationScore("new york", "New York")).toBe(100);
  });

  it("returns 80 when job location contains 'remote'", () => {
    expect(locationScore("San Francisco", "Remote")).toBe(80);
  });

  it("returns 80 when job location contains 'remote' as part of a phrase", () => {
    expect(locationScore("Chicago", "Remote / New York")).toBe(80);
  });

  it("returns 80 for same city when user location is a substring of job location", () => {
    expect(locationScore("New York", "New York, NY")).toBe(80);
  });

  it("returns 80 for same city when job location is a substring of user location", () => {
    expect(locationScore("San Francisco, CA", "San Francisco")).toBe(80);
  });

  it("returns 20 for a complete location mismatch", () => {
    expect(locationScore("London", "Tokyo")).toBe(20);
  });

  it("returns 20 when cities are different", () => {
    expect(locationScore("Boston", "Seattle")).toBe(20);
  });
});

// ─── calculateFitScore ─────────────────────────────────────────────────────────

const defaultWeights = {
  skillsWeight: 40,
  salaryWeight: 30,
  remoteWeight: 20,
  locationWeight: 10,
};

const baseInput: FitInput = {
  userSkills: [{ name: "TypeScript", proficiency: "EXPERT" }],
  jobRequiredSkills: ["TypeScript"],
  targetSalary: 100000,
  jobSalaryMin: 80000,
  jobSalaryMax: 120000,
  userWorkPreference: "REMOTE",
  jobWorkPreference: "REMOTE",
  userPreferredLocation: "San Francisco",
  jobLocation: "San Francisco",
  weights: defaultWeights,
};

describe("calculateFitScore", () => {
  it("throws when weights do not sum to 100", () => {
    expect(() =>
      calculateFitScore({ ...baseInput, weights: { skillsWeight: 40, salaryWeight: 30, remoteWeight: 20, locationWeight: 5 } })
    ).toThrow();
  });

  it("returns 100 score when every sub-score is 100", () => {
    const result = calculateFitScore(baseInput);
    expect(result.score).toBe(100);
  });

  it("includes all four sub-scores in breakdown", () => {
    const result = calculateFitScore(baseInput);
    expect(result.breakdown).toHaveProperty("skillsScore");
    expect(result.breakdown).toHaveProperty("salaryScore");
    expect(result.breakdown).toHaveProperty("remoteScore");
    expect(result.breakdown).toHaveProperty("locationScore");
  });

  it("computes the weighted composite correctly", () => {
    // skillsScore: ADVANCED/1 required → 90
    // salaryScore: 100k in [80k,120k] → 100
    // remoteScore: REMOTE vs HYBRID → 60
    // locationScore: "Boston" vs "Seattle" → 20
    // composite = round((90*40 + 100*30 + 60*20 + 20*10)/100)
    //           = round((3600 + 3000 + 1200 + 200)/100)
    //           = round(8000/100) = 80
    const input: FitInput = {
      ...baseInput,
      userSkills: [{ name: "TypeScript", proficiency: "ADVANCED" }],
      userWorkPreference: "REMOTE",
      jobWorkPreference: "HYBRID",
      userPreferredLocation: "Boston",
      jobLocation: "Seattle",
    };
    const result = calculateFitScore(input);
    expect(result.score).toBe(80);
    expect(result.breakdown.skillsScore).toBe(90);
    expect(result.breakdown.salaryScore).toBe(100);
    expect(result.breakdown.remoteScore).toBe(60);
    expect(result.breakdown.locationScore).toBe(20);
  });

  it("rounds the composite score", () => {
    // skillsScore: INTERMEDIATE/1 → 75
    // salary: null → 100
    // remoteScore: null → 100
    // locationScore: null → 100
    // composite = round((75*40 + 100*30 + 100*20 + 100*10)/100)
    //           = round((3000 + 3000 + 2000 + 1000)/100) = round(9000/100) = 90
    const input: FitInput = {
      ...baseInput,
      userSkills: [{ name: "TypeScript", proficiency: "INTERMEDIATE" }],
      targetSalary: null,
      userWorkPreference: null,
      jobWorkPreference: null,
      userPreferredLocation: null,
      jobLocation: null,
    };
    const result = calculateFitScore(input);
    expect(result.score).toBe(90);
  });

  it("returns 0 score when no skills match and salary is below min", () => {
    const input: FitInput = {
      ...baseInput,
      userSkills: [],
      jobRequiredSkills: ["React"],
      targetSalary: 50000,
      jobSalaryMin: 80000,
      jobSalaryMax: 120000,
      userWorkPreference: "ONSITE",
      jobWorkPreference: "REMOTE",
      userPreferredLocation: "Boston",
      jobLocation: "Seattle",
    };
    const result = calculateFitScore(input);
    // skillsScore=0, salaryScore=0, remoteScore=50, locationScore=20
    // composite = round((0*40 + 0*30 + 50*20 + 20*10)/100)
    //           = round((0 + 0 + 1000 + 200)/100) = round(12) = 12
    expect(result.score).toBe(12);
  });
});
