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
    job: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    profile: { findUnique: vi.fn() },
    fitWeights: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/recalculate", () => ({
  computeJobFitScore: vi.fn().mockResolvedValue(72),
}));

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeJobFitScore } from "@/lib/recalculate";
import { GET, POST } from "./route";

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
  skills: [],
};

const mockWeights = {
  userId: "user-1",
  skillsWeight: 40,
  salaryWeight: 30,
  remoteWeight: 20,
  locationWeight: 10,
};

const mockJob = {
  id: "job-1",
  userId: "user-1",
  companyId: "co-1",
  title: "Engineer",
  description: null,
  postingUrl: null,
  salaryRangeMin: null,
  salaryRangeMax: null,
  workPreference: null,
  location: null,
  status: "APPLIED" as const,
  applicationDate: null,
  notes: null,
  fitScore: 72,
  createdAt: new Date(),
  updatedAt: new Date(),
  company: { id: "co-1", name: "Acme" },
  requiredSkills: [],
  tags: [],
};

describe("GET /api/jobs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated jobs with total", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.job.findMany).mockResolvedValue([mockJob] as any);
    vi.mocked(prisma.job.count).mockResolvedValue(1);

    const req = new Request("http://localhost/api/jobs");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toHaveLength(1);
    expect(body.data.total).toBe(1);
    expect(body.data.page).toBe(1);
    expect(body.data.limit).toBe(20);
  });

  it("filters by status", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.job.findMany).mockResolvedValue([mockJob] as any);
    vi.mocked(prisma.job.count).mockResolvedValue(1);

    const req = new Request("http://localhost/api/jobs?status=APPLIED");
    await GET(req);
    expect(prisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "APPLIED" }),
      })
    );
  });

  it("sorts by fitScore descending by default", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.job.findMany).mockResolvedValue([mockJob] as any);
    vi.mocked(prisma.job.count).mockResolvedValue(1);

    const req = new Request("http://localhost/api/jobs");
    await GET(req);
    expect(prisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: expect.objectContaining({ fitScore: expect.objectContaining({ sort: "desc" }) }),
      })
    );
  });

  it("returns 400 for an invalid sort value", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);

    const req = new Request("http://localhost/api/jobs?sort=invalid");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/jobs");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/jobs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates job and stores a computed fitScore", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.fitWeights.findUnique).mockResolvedValue(mockWeights as any);
    vi.mocked(prisma.job.create).mockResolvedValue(mockJob as any);
    vi.mocked(prisma.job.update).mockResolvedValue({ ...mockJob, fitScore: 72 } as any);

    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: JSON.stringify({
        companyId: "co-1",
        title: "Engineer",
        requiredSkills: ["TypeScript"],
        tags: ["remote"],
        status: "APPLIED",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(computeJobFitScore).toHaveBeenCalled();
    expect(prisma.job.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fitScore: 72 }) })
    );
  });

  it("returns 400 for invalid input (missing title)", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);

    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: JSON.stringify({ companyId: "co-1", requiredSkills: [], tags: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: JSON.stringify({ companyId: "co-1", title: "X", requiredSkills: [], tags: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
