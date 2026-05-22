import { requireAuth } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api-response";
import { jobCreateSchema, jobQuerySchema } from "@/lib/validations/job";
import { prisma } from "@/lib/prisma";
import { computeJobFitScore } from "@/lib/recalculate";

const JOB_INCLUDE = {
  company: { select: { id: true, name: true } },
  requiredSkills: true,
  tags: true,
} as const;

function buildOrderBy(sort: string) {
  if (sort === "applicationDate") return { applicationDate: { sort: "desc" as const, nulls: "last" as const } };
  if (sort === "company") return { company: { name: "asc" as const } };
  return { fitScore: { sort: "desc" as const, nulls: "last" as const } };
}

export async function GET(req: Request): Promise<Response> {
  try {
    const profile = await requireAuth();
    const { searchParams } = new URL(req.url);
    const parsed = jobQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return handleApiError(parsed.error);

    const { status, tag, companyId, minScore, maxScore, workPreference, sort, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: profile.id };
    if (status) where.status = status;
    if (companyId) where.companyId = companyId;
    if (workPreference) where.workPreference = workPreference;
    if (tag) where.tags = { some: { tag } };
    if (minScore !== undefined || maxScore !== undefined) {
      where.fitScore = {
        ...(minScore !== undefined ? { gte: minScore } : {}),
        ...(maxScore !== undefined ? { lte: maxScore } : {}),
      };
    }

    const [items, total] = await Promise.all([
      prisma.job.findMany({ where, skip, take: limit, orderBy: buildOrderBy(sort), include: JOB_INCLUDE }),
      prisma.job.count({ where }),
    ]);

    return ok({ items, total, page, limit });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const profile = await requireAuth();
    const body = await req.json();
    const data = jobCreateSchema.parse(body);
    const { companyId, title, requiredSkills, tags, ...rest } = data;

    const job = await prisma.job.create({
      data: {
        userId: profile.id,
        companyId,
        title,
        ...rest,
        requiredSkills: { create: requiredSkills.map((skillName) => ({ skillName })) },
        tags: { create: tags.map((tag) => ({ tag })) },
      },
      include: JOB_INCLUDE,
    });

    const [profileWithSkills, weights] = await Promise.all([
      prisma.profile.findUnique({ where: { id: profile.id }, include: { skills: true } }),
      prisma.fitWeights.findUnique({ where: { userId: profile.id } }),
    ]);

    if (profileWithSkills && weights) {
      const fitScore = computeJobFitScore(job as any, profileWithSkills, weights);
      await prisma.job.update({ where: { id: job.id }, data: { fitScore } });
      return ok({ ...job, fitScore }, 201);
    }

    return ok(job, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
