import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(),
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
    company: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
};

const adminProfile = { ...userProfile, id: "admin-1", email: "admin@example.com", role: "ADMIN" as const };

const otherProfile = { ...userProfile, id: "user-2", email: "other@example.com" };

const mockCompany = {
  id: "co-1",
  name: "Acme Corp",
  industry: "Tech",
  size: null,
  location: "Austin, TX",
  website: null,
  cultureNotes: null,
  createdById: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("GET /api/companies/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the company", async () => {
    vi.mocked(requireAuth).mockResolvedValue(userProfile as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);

    const req = new Request("http://localhost/api/companies/co-1");
    const res = await GET(req, { params: makeParams("co-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe("co-1");
  });

  it("returns 404 when company does not exist", async () => {
    vi.mocked(requireAuth).mockResolvedValue(userProfile as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/companies/missing");
    const res = await GET(req, { params: makeParams("missing") });
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/companies/co-1");
    const res = await GET(req, { params: makeParams("co-1") });
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/companies/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows update by creator", async () => {
    vi.mocked(requireAuth).mockResolvedValue(userProfile as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
    vi.mocked(prisma.company.update).mockResolvedValue({ ...mockCompany, name: "Updated" } as any);

    const req = new Request("http://localhost/api/companies/co-1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated" }),
    });
    const res = await PATCH(req, { params: makeParams("co-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe("Updated");
  });

  it("allows update by ADMIN", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
    vi.mocked(prisma.company.update).mockResolvedValue({ ...mockCompany, name: "Updated" } as any);

    const req = new Request("http://localhost/api/companies/co-1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated" }),
    });
    const res = await PATCH(req, { params: makeParams("co-1") });
    expect(res.status).toBe(200);
  });

  it("returns 403 when caller is neither creator nor ADMIN", async () => {
    vi.mocked(requireAuth).mockResolvedValue(otherProfile as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);

    const req = new Request("http://localhost/api/companies/co-1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Nope" }),
    });
    const res = await PATCH(req, { params: makeParams("co-1") });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 404 when company does not exist", async () => {
    vi.mocked(requireAuth).mockResolvedValue(userProfile as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/companies/missing", {
      method: "PATCH",
      body: JSON.stringify({ name: "X" }),
    });
    const res = await PATCH(req, { params: makeParams("missing") });
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/companies/co-1", {
      method: "PATCH",
      body: JSON.stringify({ name: "X" }),
    });
    const res = await PATCH(req, { params: makeParams("co-1") });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/companies/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows delete by ADMIN", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);
    vi.mocked(prisma.company.delete).mockResolvedValue(mockCompany as any);

    const req = new Request("http://localhost/api/companies/co-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("co-1") });
    expect(res.status).toBe(200);
  });

  it("returns 403 when caller is a USER", async () => {
    vi.mocked(requireAuth).mockResolvedValue(userProfile as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(mockCompany as any);

    const req = new Request("http://localhost/api/companies/co-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("co-1") });
    expect(res.status).toBe(403);
  });

  it("returns 404 when company does not exist", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminProfile as any);
    vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/companies/co-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("co-1") });
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/companies/co-1", { method: "DELETE" });
    const res = await DELETE(req, { params: makeParams("co-1") });
    expect(res.status).toBe(401);
  });
});
