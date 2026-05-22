import { requireAdmin } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const JOB_INCLUDE = {
  company: { select: { id: true, name: true } },
  profile: { select: { id: true, email: true } },
  requiredSkills: true,
  tags: true,
} as const;

export async function GET(req: Request): Promise<Response> {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const { page, limit } = querySchema.parse(Object.fromEntries(searchParams));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: JOB_INCLUDE,
      }),
      prisma.job.count(),
    ]);

    return ok({ items, total, page, limit });
  } catch (e) {
    return handleApiError(e);
  }
}
