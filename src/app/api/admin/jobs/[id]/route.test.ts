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
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DELETE } from "./route";

const makeParams = (id: string) => Promise.resolve({ id });

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
  status: "APPLIED" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("DELETE /api/admin/jobs/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows ADMIN to delete any job", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(mockJob as any);
    vi.mocked(prisma.job.delete).mockResolvedValue(mockJob as any);

    const req = new Request("http://localhost/api/admin/jobs/job-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("job-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe("job-1");
    expect(prisma.job.delete).toHaveBeenCalledWith({ where: { id: "job-1" } });
  });

  it("returns 404 when job not found", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.job.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/admin/jobs/missing", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("missing") });
    expect(res.status).toBe(404);
  });

  it("returns 403 for USER", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const req = new Request("http://localhost/api/admin/jobs/job-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("job-1") });
    expect(res.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new UnauthorizedError());

    const req = new Request("http://localhost/api/admin/jobs/job-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("job-1") });
    expect(res.status).toBe(401);
  });
});
