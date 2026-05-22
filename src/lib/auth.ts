import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/generated/prisma/client";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

export async function getOrCreateProfile(user: {
  id: string;
  email: string;
}): Promise<Profile> {
  return prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email,
      name: user.email.split("@")[0],
      role: "USER",
    },
    update: {},
  });
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  return getOrCreateProfile({ id: user.id, email: user.email });
}

export async function requireAuth(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new UnauthorizedError();
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new UnauthorizedError();
  if (profile.role !== "ADMIN") throw new ForbiddenError();
  return profile;
}
