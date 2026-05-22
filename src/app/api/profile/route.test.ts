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
    profile: {
      update: vi.fn(),
    },
  },
}));

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET, PATCH } from "./route";

const mockProfile = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  role: "USER" as const,
  targetSalary: null,
  workPreference: null,
  preferredLocation: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("GET /api/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the caller's profile", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toMatchObject({ id: "user-1", email: "test@example.com" });
    expect(body.error).toBeNull();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("PATCH /api/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates and returns the profile", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    const updated = { ...mockProfile, name: "Updated Name" };
    vi.mocked(prisma.profile.update).mockResolvedValue(updated as any);

    const req = new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated Name" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.name).toBe("Updated Name");
    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } })
    );
  });

  it("returns 400 for an invalid body (empty name fails min(1))", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    const req = new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ name: "x" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });
});
