import { requireAdmin } from "@/lib/auth";
import { ok, errorResponse, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params): Promise<Response> {
  try {
    await requireAdmin();
    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return errorResponse(404, "NOT_FOUND", "Job not found");
    await prisma.job.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return handleApiError(e);
  }
}
