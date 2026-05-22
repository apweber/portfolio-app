import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor() {
      super("Unauthorized");
      this.name = "UnauthorizedError";
    }
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    fitWeights: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/lib/recalculate", () => ({
  recalculateUserJobs: vi.fn().mockResolvedValue(undefined),
}));

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateUserJobs } from "@/lib/recalculate";
import { GET, PUT } from "./route";

const mockProfile = {
  id: "user-1",
  email: "test@example.com",
  name: "Test",
  role: "USER" as const,
  targetSalary: null,
  workPreference: null,
  preferredLocation: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultWeights = {
  userId: "user-1",
  skillsWeight: 40,
  salaryWeight: 30,
  remoteWeight: 20,
  locationWeight: 10,
};

describe("GET /api/fit-weights", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns existing fit weights", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.fitWeights.findUnique).mockResolvedValue(defaultWeights as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject(defaultWeights);
  });

  it("creates and returns defaults when no weights row exists", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.fitWeights.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.fitWeights.upsert).mockResolvedValue(defaultWeights as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.skillsWeight).toBe(40);
    expect(body.data.salaryWeight).toBe(30);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("PUT /api/fit-weights", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts and returns the weights", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.fitWeights.upsert).mockResolvedValue(defaultWeights as any);

    const req = new Request("http://localhost/api/fit-weights", {
      method: "PUT",
      body: JSON.stringify({
        skillsWeight: 40,
        salaryWeight: 30,
        remoteWeight: 20,
        locationWeight: 10,
      }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject(defaultWeights);
    expect(prisma.fitWeights.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });

  it("returns 422 when weights do not sum to 100", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);

    const req = new Request("http://localhost/api/fit-weights", {
      method: "PUT",
      body: JSON.stringify({
        skillsWeight: 40,
        salaryWeight: 30,
        remoteWeight: 15,
        locationWeight: 10,
      }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.message).toContain("Weights must sum to 100");
  });

  it("returns 400 when individual field values are invalid", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);

    const req = new Request("http://localhost/api/fit-weights", {
      method: "PUT",
      body: JSON.stringify({
        skillsWeight: -1,
        salaryWeight: 30,
        remoteWeight: 20,
        locationWeight: 10,
      }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("triggers recalculation fire-and-forget after a successful PUT", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.fitWeights.upsert).mockResolvedValue(defaultWeights as any);

    const req = new Request("http://localhost/api/fit-weights", {
      method: "PUT",
      body: JSON.stringify({
        skillsWeight: 40,
        salaryWeight: 30,
        remoteWeight: 20,
        locationWeight: 10,
      }),
    });
    await PUT(req);
    await new Promise((r) => setTimeout(r, 0));
    expect(recalculateUserJobs).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/fit-weights", {
      method: "PUT",
      body: JSON.stringify({
        skillsWeight: 40,
        salaryWeight: 30,
        remoteWeight: 20,
        locationWeight: 10,
      }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });
});
