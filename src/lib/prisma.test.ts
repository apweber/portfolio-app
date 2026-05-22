import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  ApplicationStatus,
  WorkPreference,
  Proficiency,
  Role,
} from "@/generated/prisma/client";

describe("prisma singleton", () => {
  it("returns the same instance when imported twice", async () => {
    const { prisma: prisma2 } = await import("@/lib/prisma");
    expect(prisma).toBe(prisma2);
  });
});

describe("enums", () => {
  it("ApplicationStatus has expected members", () => {
    expect(ApplicationStatus.APPLIED).toBe("APPLIED");
    expect(ApplicationStatus.PHONE_SCREEN).toBe("PHONE_SCREEN");
    expect(ApplicationStatus.INTERVIEWING).toBe("INTERVIEWING");
    expect(ApplicationStatus.OFFER).toBe("OFFER");
    expect(ApplicationStatus.REJECTED).toBe("REJECTED");
  });

  it("WorkPreference has expected members", () => {
    expect(WorkPreference.REMOTE).toBe("REMOTE");
    expect(WorkPreference.HYBRID).toBe("HYBRID");
    expect(WorkPreference.ONSITE).toBe("ONSITE");
  });

  it("Proficiency has expected members", () => {
    expect(Proficiency.BEGINNER).toBe("BEGINNER");
    expect(Proficiency.INTERMEDIATE).toBe("INTERMEDIATE");
    expect(Proficiency.ADVANCED).toBe("ADVANCED");
    expect(Proficiency.EXPERT).toBe("EXPERT");
  });

  it("Role has expected members", () => {
    expect(Role.USER).toBe("USER");
    expect(Role.ADMIN).toBe("ADMIN");
  });
});
