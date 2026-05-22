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
    company: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe("GET /api/companies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated companies with total", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.company.findMany).mockResolvedValue([mockCompany] as any);
    vi.mocked(prisma.company.count).mockResolvedValue(1);

    const req = makeRequest("http://localhost/api/companies");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toHaveLength(1);
    expect(body.data.total).toBe(1);
    expect(body.data.page).toBe(1);
    expect(body.data.limit).toBe(20);
  });

  it("passes q param as case-insensitive contains filter", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.company.findMany).mockResolvedValue([mockCompany] as any);
    vi.mocked(prisma.company.count).mockResolvedValue(1);

    const req = makeRequest("http://localhost/api/companies?q=acme");
    await GET(req);

    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.objectContaining({ contains: "acme" }) }),
          ]),
        }),
      })
    );
  });

  it("respects page and limit params", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.company.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.company.count).mockResolvedValue(0);

    const req = makeRequest("http://localhost/api/companies?page=2&limit=10");
    const res = await GET(req);
    const body = await res.json();
    expect(body.data.page).toBe(2);
    expect(body.data.limit).toBe(10);
    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = makeRequest("http://localhost/api/companies");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/companies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a company with createdById set to caller", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);
    vi.mocked(prisma.company.create).mockResolvedValue(mockCompany as any);

    const req = makeRequest("http://localhost/api/companies", {
      method: "POST",
      body: JSON.stringify({ name: "Acme Corp" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(prisma.company.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ createdById: "user-1", name: "Acme Corp" }),
      })
    );
  });

  it("returns 400 for empty company name", async () => {
    vi.mocked(requireAuth).mockResolvedValue(mockProfile as any);

    const req = makeRequest("http://localhost/api/companies", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValue(new UnauthorizedError());
    const req = makeRequest("http://localhost/api/companies", {
      method: "POST",
      body: JSON.stringify({ name: "X" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
