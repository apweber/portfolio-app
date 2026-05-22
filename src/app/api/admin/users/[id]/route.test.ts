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
    profile: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { requireAdmin, UnauthorizedError, ForbiddenError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PATCH } from "./route";

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

describe("PATCH /api/admin/users/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("promotes a user to ADMIN", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ ...adminProfile, id: "user-1", role: "USER" } as any);
    vi.mocked(prisma.profile.update).mockResolvedValue({ ...adminProfile, id: "user-1", role: "ADMIN" } as any);

    const req = new Request("http://localhost/api/admin/users/user-1", {
      method: "PATCH",
      body: JSON.stringify({ role: "ADMIN" }),
    });
    const res = await PATCH(req, { params: makeParams("user-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.role).toBe("ADMIN");
    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" }, data: { role: "ADMIN" } })
    );
  });

  it("demotes an ADMIN to USER", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.profile.update).mockResolvedValue({ ...adminProfile, role: "USER" } as any);

    const req = new Request("http://localhost/api/admin/users/admin-1", {
      method: "PATCH",
      body: JSON.stringify({ role: "USER" }),
    });
    const res = await PATCH(req, { params: makeParams("admin-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.role).toBe("USER");
  });

  it("returns 400 for an invalid role value", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(adminProfile as any);

    const req = new Request("http://localhost/api/admin/users/user-1", {
      method: "PATCH",
      body: JSON.stringify({ role: "SUPERUSER" }),
    });
    const res = await PATCH(req, { params: makeParams("user-1") });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when profile not found", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/admin/users/missing", {
      method: "PATCH",
      body: JSON.stringify({ role: "USER" }),
    });
    const res = await PATCH(req, { params: makeParams("missing") });
    expect(res.status).toBe(404);
  });

  it("returns 403 for USER", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new ForbiddenError());

    const req = new Request("http://localhost/api/admin/users/user-1", {
      method: "PATCH",
      body: JSON.stringify({ role: "ADMIN" }),
    });
    const res = await PATCH(req, { params: makeParams("user-1") });
    expect(res.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new UnauthorizedError());

    const req = new Request("http://localhost/api/admin/users/user-1", {
      method: "PATCH",
      body: JSON.stringify({ role: "ADMIN" }),
    });
    const res = await PATCH(req, { params: makeParams("user-1") });
    expect(res.status).toBe(401);
  });
});
