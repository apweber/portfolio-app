import { requireAuth } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api-response";
import { skillCreateSchema } from "@/lib/validations/skill";
import { prisma } from "@/lib/prisma";
import { recalculateUserJobs } from "@/lib/recalculate";

export async function GET(): Promise<Response> {
  try {
    const profile = await requireAuth();
    const skills = await prisma.skill.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "asc" },
    });
    return ok(skills);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const profile = await requireAuth();
    const body = await req.json();
    const data = skillCreateSchema.parse(body);
    const skill = await prisma.skill.create({
      data: { userId: profile.id, ...data },
    });
    void recalculateUserJobs(profile.id).catch(console.error);
    return ok(skill, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
