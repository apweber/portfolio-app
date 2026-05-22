import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      upsert: vi.fn(),
    },
  },
}));

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentProfile,
  requireAuth,
  requireAdmin,
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/auth";

const mockUser = { id: "user-123", email: "alice@example.com" };
const mockProfile = {
  id: "user-123",
  email: "alice@example.com",
  name: "alice",
  role: "USER" as const,
  targetSalary: null,
  workPreference: null,
  preferredLocation: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function setupSupabaseMock(user: { id: string; email: string } | null) {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  } as any);
}

describe("getCurrentProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when there is no authenticated user", async () => {
    setupSupabaseMock(null);
    const result = await getCurrentProfile();
    expect(result).toBeNull();
    expect(prisma.profile.upsert).not.toHaveBeenCalled();
  });

  it("upserts and returns a profile when a session exists", async () => {
    setupSupabaseMock(mockUser);
    vi.mocked(prisma.profile.upsert).mockResolvedValue(mockProfile as any);

    const result = await getCurrentProfile();

    expect(prisma.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-123" },
        create: expect.objectContaining({
          id: "user-123",
          email: "alice@example.com",
          name: "alice",
        }),
      })
    );
    expect(result).toEqual(mockProfile);
  });

  it("derives the default profile name from the email local-part", async () => {
    setupSupabaseMock({ id: "user-456", email: "bob.smith@company.org" });
    vi.mocked(prisma.profile.upsert).mockResolvedValue({
      ...mockProfile,
      name: "bob.smith",
    } as any);

    await getCurrentProfile();

    expect(prisma.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ name: "bob.smith" }),
      })
    );
  });
});

describe("requireAuth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws UnauthorizedError when there is no session", async () => {
    setupSupabaseMock(null);
    await expect(requireAuth()).rejects.toThrow(UnauthorizedError);
  });

  it("returns the profile when authenticated", async () => {
    setupSupabaseMock(mockUser);
    vi.mocked(prisma.profile.upsert).mockResolvedValue(mockProfile as any);
    await expect(requireAuth()).resolves.toEqual(mockProfile);
  });
});

describe("requireAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws UnauthorizedError when not authenticated", async () => {
    setupSupabaseMock(null);
    await expect(requireAdmin()).rejects.toThrow(UnauthorizedError);
  });

  it("throws ForbiddenError for a USER role", async () => {
    setupSupabaseMock(mockUser);
    vi.mocked(prisma.profile.upsert).mockResolvedValue(mockProfile as any);
    await expect(requireAdmin()).rejects.toThrow(ForbiddenError);
  });

  it("returns the profile for an ADMIN role", async () => {
    const adminProfile = { ...mockProfile, role: "ADMIN" as const };
    setupSupabaseMock(mockUser);
    vi.mocked(prisma.profile.upsert).mockResolvedValue(adminProfile as any);
    await expect(requireAdmin()).resolves.toEqual(adminProfile);
  });
});
