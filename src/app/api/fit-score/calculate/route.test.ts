import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/fit-score/calculate", () => ({
  calculateFitScore: vi.fn(),
}));

import { calculateFitScore } from "@/lib/fit-score/calculate";
import { POST } from "./route";

const validBody: object = {
  userSkills: [],
  jobRequiredSkills: [],
  targetSalary: null,
  jobSalaryMin: null,
  jobSalaryMax: null,
  userWorkPreference: null,
  jobWorkPreference: null,
  userPreferredLocation: null,
  jobLocation: null,
  weights: { skillsWeight: 40, salaryWeight: 30, remoteWeight: 20, locationWeight: 10 },
};

const mockResult = {
  score: 85,
  breakdown: { skillsScore: 100, salaryScore: 100, remoteScore: 100, locationScore: 100 },
};

describe("POST /api/fit-score/calculate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("FIT_SCORE_SECRET", "s3cr3t");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns 401 when Authorization header is missing", async () => {
    const req = new Request("http://localhost/api/fit-score/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when Authorization header is wrong", async () => {
    const req = new Request("http://localhost/api/fit-score/calculate", {
      method: "POST",
      headers: { Authorization: "Bearer wrong", "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 with fit score result when authorized", async () => {
    vi.mocked(calculateFitScore).mockReturnValue(mockResult);
    const req = new Request("http://localhost/api/fit-score/calculate", {
      method: "POST",
      headers: { Authorization: "Bearer s3cr3t", "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.score).toBe(85);
    expect(body.data.breakdown).toBeDefined();
  });

  it("skips auth check when FIT_SCORE_SECRET is not set", async () => {
    vi.stubEnv("FIT_SCORE_SECRET", "");
    vi.mocked(calculateFitScore).mockReturnValue(mockResult);
    const req = new Request("http://localhost/api/fit-score/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
