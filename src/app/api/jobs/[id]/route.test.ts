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
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    profile: { findUnique: vi.fn() },
    fitWeights: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/recalculate", () => ({
  computeJobFitScore: vi.fn().mockResolvedValue(80),
}));

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeJobFitScore } from "@/lib/recalculate";
import { GET, PATCH, DELETE } from "./route";

const makeParams = (id: string) => Promise.resolve({ id });

const userProfile = {
  id: "user-1",
  email: "user@example.com",
  name: "User",
  role: "USER" as const,
  targetSalary: null,
  workPreference: null,
  preferredLocation: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  skills: [],
};

const adminProfile = { ...userProfile, id: "admin-1", email: "admin@example.com", role: "ADMIN" as const };

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
  fitScore: 75,
  createdAt: new Date(),
  updatedAt: new Date(),
  company: { id: "co-1", name: "Acme" },
  requiredSkills: [],
  tags: [],
};

describe("GET /api/jobs/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a job owned by the caller", async () => {
    vi.mocked(requireAuth).mockResolvedValue(userProfile as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);

    const req = new Request("http://localhost/api/jobs/job-1");
    const res = await GET(req, { params: makeParams("job-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe("job-1");
  });

  it("returns 404 when job not found", async () => {
    vi.mocked(requireAuth).mockResolvedValue(userProfile as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/jobs/missing");
    const res = await GET(req, { params: makeParams("missing") });
    expect(res.status).toBe(404);
  });

  it("returns 404 when USER tries to access another user's job", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ ...userProfile, id: "user-2" } as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);

    const req = new Request("http://localhost/api/jobs/job-1");
    const res = await GET(req, { params: makeParams("job-1") });
    expect(res.status).toBe(404);
  });

  it("allows ADMIN to access any job", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);

    const req = new Request("http://localhost/api/jobs/job-1");
    const res = await GET(req, { params: makeParams("job-1") });
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/jobs/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates job and recomputes fitScore", async () => {
    vi.mocked(requireAuth).mockResolvedValue(userProfile as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(userProfile as any);
    vi.mocked(prisma.fitWeights.findUnique).mockResolvedValue(mockWeights as any);
    vi.mocked(prisma.job.update).mockResolvedValue({ ...mockJob, notes: "Updated", fitScore: 80 } as any);

    const req = new Request("http://localhost/api/jobs/job-1", {
      method: "PATCH",
      body: JSON.stringify({ notes: "Updated" }),
    });
    const res = await PATCH(req, { params: makeParams("job-1") });
    expect(res.status).toBe(200);
    expect(computeJobFitScore).toHaveBeenCalled();
    const body = await res.json();
    expect(body.data.fitScore).toBe(80);
  });

  it("returns 404 when USER patches a job they do not own", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ ...userProfile, id: "user-2" } as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);

    const req = new Request("http://localhost/api/jobs/job-1", {
      method: "PATCH",
      body: JSON.stringify({ notes: "X" }),
    });
    const res = await PATCH(req, { params: makeParams("job-1") });
    expect(res.status).toBe(404);
  });

  it("allows ADMIN to patch any job", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.fitWeights.findUnique).mockResolvedValue(mockWeights as any);
    vi.mocked(prisma.job.update).mockResolvedValue({ ...mockJob, fitScore: 80 } as any);

    const req = new Request("http://localhost/api/jobs/job-1", {
      method: "PATCH",
      body: JSON.stringify({ notes: "Admin edit" }),
    });
    const res = await PATCH(req, { params: makeParams("job-1") });
    expect(res.status).toBe(200);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/jobs/job-1", {
      method: "PATCH",
      body: JSON.stringify({ notes: "X" }),
    });
    const res = await PATCH(req, { params: makeParams("job-1") });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/jobs/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes an owned job", async () => {
    vi.mocked(requireAuth).mockResolvedValue(userProfile as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
    vi.mocked(prisma.job.delete).mockResolvedValue(mockJob as any);

    const req = new Request("http://localhost/api/jobs/job-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("job-1") });
    expect(res.status).toBe(200);
  });

  it("returns 404 when USER tries to delete another user's job", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ ...userProfile, id: "user-2" } as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);

    const req = new Request("http://localhost/api/jobs/job-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("job-1") });
    expect(res.status).toBe(404);
  });

  it("allows ADMIN to delete any job", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
    vi.mocked(prisma.job.delete).mockResolvedValue(mockJob as any);

    const req = new Request("http://localhost/api/jobs/job-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("job-1") });
    expect(res.status).toBe(200);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/jobs/job-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("job-1") });
    expect(res.status).toBe(401);
  });
});
