import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { scoreViaService } from "./client";
import type { FitInput } from "./calculate";

const mockInput: FitInput = {
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

describe("scoreViaService", () => {
  beforeEach(() => {
    vi.stubEnv("FIT_SCORE_SERVICE_URL", "http://fit-score.internal");
    vi.stubEnv("FIT_SCORE_SECRET", "test-secret");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns the result on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(mockResult) })
    );
    const result = await scoreViaService(mockInput);
    expect(result).toEqual(mockResult);
    expect(fetch).toHaveBeenCalledWith(
      "http://fit-score.internal",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-secret" }),
      })
    );
  });

  it("retries once on first failure and returns result on second attempt", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.reject(new Error("Network error"));
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockResult) });
      })
    );
    const result = await scoreViaService(mockInput);
    expect(result).toEqual(mockResult);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws after two consecutive failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    await expect(scoreViaService(mockInput)).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws immediately when FIT_SCORE_SERVICE_URL is not set", async () => {
    vi.stubEnv("FIT_SCORE_SERVICE_URL", "");
    await expect(scoreViaService(mockInput)).rejects.toThrow("FIT_SCORE_SERVICE_URL not configured");
  });
});
