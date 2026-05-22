import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor() {
      super("Unauthorized");
      this.name = "UnauthorizedError";
    }
  },
  ForbiddenError: class ForbiddenError extends Error {
    constructor() {
      super("Forbidden");
      this.name = "ForbiddenError";
    }
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    job: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

const adminProfile = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin",
  role: "ADMIN" as const,
  targetSalary: null,
  workPreference: null,
  preferredLocation: null,
  createdAt: new Date(),
  updatedAt: new Date(),
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
  profile: { id: "user-1", email: "user@example.com" },
  requiredSkills: [],
  tags: [],
};

describe("GET /api/admin/jobs", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all jobs with owner email and company for ADMIN", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.job.findMany).mockResolvedValue([mockJob] as any);
    vi.mocked(prisma.job.count).mockResolvedValue(1);

    const req = new Request("http://localhost/api/admin/jobs");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toHaveLength(1);
    expect(body.data.total).toBe(1);
    expect(body.data.items[0].profile.email).toBe("user@example.com");
    expect(body.data.items[0].company.name).toBe("Acme");
  });

  it("paginates results", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.job.findMany).mockResolvedValue([mockJob] as any);
    vi.mocked(prisma.job.count).mockResolvedValue(50);

    const req = new Request("http://localhost/api/admin/jobs?page=2&limit=10");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.page).toBe(2);
    expect(body.data.limit).toBe(10);
    expect(prisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });

  it("returns 403 for USER", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const req = new Request("http://localhost/api/admin/jobs");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new UnauthorizedError());

    const req = new Request("http://localhost/api/admin/jobs");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
