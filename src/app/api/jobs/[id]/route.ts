import { requireAuth } from "@/lib/auth";
import { ok, errorResponse, handleApiError } from "@/lib/api-response";
import { jobUpdateSchema } from "@/lib/validations/job";
import { prisma } from "@/lib/prisma";
import { computeJobFitScore } from "@/lib/recalculate";

type Params = { params: Promise<{ id: string }> };

const JOB_INCLUDE = {
  company: { select: { id: true, name: true } },
  requiredSkills: true,
  tags: true,
} as const;

export async function GET(_req: Request, { params }: Params): Promise<Response> {
  try {
    const profile = await requireAuth();
    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id }, include: JOB_INCLUDE });
    if (!job) return errorResponse(404, "NOT_FOUND", "Job not found");
    if (job.userId !== profile.id && profile.role !== "ADMIN") {
      return errorResponse(404, "NOT_FOUND", "Job not found");
    }
    return ok(job);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  try {
    const profile = await requireAuth();
    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id }, include: JOB_INCLUDE });
    if (!job) return errorResponse(404, "NOT_FOUND", "Job not found");
    if (job.userId !== profile.id && profile.role !== "ADMIN") {
      return errorResponse(404, "NOT_FOUND", "Job not found");
    }

    const body = await req.json();
    const data = jobUpdateSchema.parse(body);
    const { requiredSkills, tags, companyId, title, ...rest } = data;

    const updated = await prisma.job.update({
      where: { id },
      data: {
        ...(companyId !== undefined ? { companyId } : {}),
        ...(title !== undefined ? { title } : {}),
        ...rest,
        ...(requiredSkills !== undefined
          ? { requiredSkills: { deleteMany: {}, createMany: { data: requiredSkills.map((skillName) => ({ skillName })) } } }
          : {}),
        ...(tags !== undefined
          ? { tags: { deleteMany: {}, createMany: { data: tags.map((tag) => ({ tag })) } } }
          : {}),
      },
      include: JOB_INCLUDE,
    });

    const ownerId = job.userId;
    const [profileWithSkills, weights] = await Promise.all([
      prisma.profile.findUnique({ where: { id: ownerId }, include: { skills: true } }),
      prisma.fitWeights.findUnique({ where: { userId: ownerId } }),
    ]);

    if (profileWithSkills && weights) {
      const fitScore = await computeJobFitScore(updated as any, profileWithSkills, weights);
      const withScore = await prisma.job.update({ where: { id }, data: { fitScore }, include: JOB_INCLUDE });
      return ok(withScore);
    }

    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params): Promise<Response> {
  try {
    const profile = await requireAuth();
    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return errorResponse(404, "NOT_FOUND", "Job not found");
    if (job.userId !== profile.id && profile.role !== "ADMIN") {
      return errorResponse(404, "NOT_FOUND", "Job not found");
    }
    await prisma.job.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return handleApiError(e);
  }
}
