import { requireAuth } from "@/lib/auth";
import { ok, errorResponse, handleApiError } from "@/lib/api-response";
import { skillUpdateSchema } from "@/lib/validations/skill";
import { prisma } from "@/lib/prisma";
import { recalculateUserJobs } from "@/lib/recalculate";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  try {
    const profile = await requireAuth();
    const { id } = await params;
    const existing = await prisma.skill.findFirst({
      where: { id, userId: profile.id },
    });
    if (!existing) {
      return errorResponse(404, "NOT_FOUND", "Skill not found");
    }
    const body = await req.json();
    const data = skillUpdateSchema.parse(body);
    const updated = await prisma.skill.update({ where: { id }, data });
    void recalculateUserJobs(profile.id).catch(console.error);
    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: Request, { params }: Params): Promise<Response> {
  try {
    const profile = await requireAuth();
    const { id } = await params;
    const existing = await prisma.skill.findFirst({
      where: { id, userId: profile.id },
    });
    if (!existing) {
      return errorResponse(404, "NOT_FOUND", "Skill not found");
    }
    await prisma.skill.delete({ where: { id } });
    void recalculateUserJobs(profile.id).catch(console.error);
    return ok({ id });
  } catch (e) {
    return handleApiError(e);
  }
}
