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
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/recalculate", () => ({
  recalculateUserJobs: vi.fn().mockResolvedValue(undefined),
}));

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateUserJobs } from "@/lib/recalculate";
import { PATCH, DELETE } from "./route";

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

function makeParams(id: string) {
  return Promise.resolve({ id });
}

describe("PATCH /api/skills/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates proficiency and triggers recalculation", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.skill.findFirst).mockResolvedValue(mockSkill as any);
    const updated = { ...mockSkill, proficiency: "ADVANCED" as const };
    vi.mocked(prisma.skill.update).mockResolvedValue(updated as any);

    const req = new Request("http://localhost/api/skills/skill-1", {
      method: "PATCH",
      body: JSON.stringify({ proficiency: "ADVANCED" }),
    });
    const res = await PATCH(req, { params: makeParams("skill-1") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.proficiency).toBe("ADVANCED");
    await new Promise((r) => setTimeout(r, 0));
    expect(recalculateUserJobs).toHaveBeenCalledWith("user-1");
  });

  it("returns 404 when skill not owned by caller", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.skill.findFirst).mockResolvedValue(null);

    const req = new Request("http://localhost/api/skills/other-skill", {
      method: "PATCH",
      body: JSON.stringify({ proficiency: "EXPERT" }),
    });
    const res = await PATCH(req, { params: makeParams("other-skill") });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 400 for invalid proficiency value", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.skill.findFirst).mockResolvedValue(mockSkill as any);

    const req = new Request("http://localhost/api/skills/skill-1", {
      method: "PATCH",
      body: JSON.stringify({ proficiency: "GODLIKE" }),
    });
    const res = await PATCH(req, { params: makeParams("skill-1") });
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/skills/skill-1", {
      method: "PATCH",
      body: JSON.stringify({ proficiency: "ADVANCED" }),
    });
    const res = await PATCH(req, { params: makeParams("skill-1") });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/skills/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes an owned skill and triggers recalculation", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.skill.findFirst).mockResolvedValue(mockSkill as any);
    vi.mocked(prisma.skill.delete).mockResolvedValue(mockSkill as any);

    const req = new Request("http://localhost/api/skills/skill-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: makeParams("skill-1") });
    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 0));
    expect(recalculateUserJobs).toHaveBeenCalledWith("user-1");
  });

  it("returns 404 when skill not owned by caller", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.skill.findFirst).mockResolvedValue(null);

    const req = new Request("http://localhost/api/skills/other-skill", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: makeParams("other-skill") });
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = new Request("http://localhost/api/skills/skill-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: makeParams("skill-1") });
    expect(res.status).toBe(401);
  });
});
