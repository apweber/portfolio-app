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
    profile: { findMany: vi.fn() },
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

const mockProfiles = [adminProfile, { ...adminProfile, id: "user-1", email: "user@example.com", role: "USER" as const }];

describe("GET /api/admin/users", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all profiles for ADMIN", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.profile.findMany).mockResolvedValue(mockProfiles as any);

    const req = new Request("http://localhost/api/admin/users");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
  });

  it("returns 403 for USER", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const req = new Request("http://localhost/api/admin/users");
    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new UnauthorizedError());

    const req = new Request("http://localhost/api/admin/users");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
