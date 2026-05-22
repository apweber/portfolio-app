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
    skill: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/recalculate", () => ({
  recalculateUserJobs: vi.fn().mockResolvedValue(undefined),
}));

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateUserJobs } from "@/lib/recalculate";
import { Prisma } from "@/generated/prisma/client";
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
};

const mockSkill = {
  id: "skill-1",
  userId: "user-1",
  name: "TypeScript",
  proficiency: "INTERMEDIATE" as const,
  createdAt: new Date(),
};

describe("GET /api/skills", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the caller's skills", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.skill.findMany).mockResolvedValue([mockSkill] as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("TypeScript");
    expect(prisma.skill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

describe("POST /api/skills", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a skill and triggers recalculation", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.skill.create).mockResolvedValue(mockSkill as any);

    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      body: JSON.stringify({ name: "TypeScript", proficiency: "INTERMEDIATE" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.name).toBe("TypeScript");
    expect(prisma.skill.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1", name: "TypeScript" }),
      })
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(recalculateUserJobs).toHaveBeenCalledWith("user-1");
  });

  it("returns 409 for a duplicate skill name", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.skill.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "7.0.0",
      })
    );

    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      body: JSON.stringify({ name: "TypeScript", proficiency: "INTERMEDIATE" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("DUPLICATE");
  });

  it("returns 400 for invalid input (empty name)", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);

    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      body: JSON.stringify({ name: "", proficiency: "INTERMEDIATE" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/skills", {
      method: "POST",
      body: JSON.stringify({ name: "Go", proficiency: "ADVANCED" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
