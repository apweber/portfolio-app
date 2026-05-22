import { requireAuth } from "@/lib/auth";
import { ok, errorResponse, handleApiError } from "@/lib/api-response";
import { fitWeightsSchema } from "@/lib/validations/fitWeights";
import { prisma } from "@/lib/prisma";
import { recalculateUserJobs } from "@/lib/recalculate";

const DEFAULT_WEIGHTS = {
  skillsWeight: 40,
  salaryWeight: 30,
  remoteWeight: 20,
  locationWeight: 10,
};

export async function GET(): Promise<Response> {
  try {
    const profile = await requireAuth();
    let weights = await prisma.fitWeights.findUnique({
      where: { userId: profile.id },
    });
    if (!weights) {
      weights = await prisma.fitWeights.upsert({
        where: { userId: profile.id },
        create: { userId: profile.id, ...DEFAULT_WEIGHTS },
        update: {},
      });
    }
    return ok(weights);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request): Promise<Response> {
  try {
    const profile = await requireAuth();
    const body = await req.json();
    const result = fitWeightsSchema.safeParse(body);
    if (!result.success) {
      const isRefinementOnly = result.error.issues.every((i) => i.path.length === 0);
      if (isRefinementOnly) {
        return errorResponse(422, "VALIDATION_ERROR", "Weights must sum to 100");
      }
      return handleApiError(result.error);
    }
    const weights = await prisma.fitWeights.upsert({
      where: { userId: profile.id },
      create: { userId: profile.id, ...result.data },
      update: result.data,
    });
    void recalculateUserJobs(profile.id).catch(console.error);
    return ok(weights);
  } catch (e) {
    return handleApiError(e);
  }
}
