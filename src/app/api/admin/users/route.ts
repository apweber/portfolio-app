import { requireAdmin } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request): Promise<Response> {
  try {
    await requireAdmin();
    const profiles = await prisma.profile.findMany({ orderBy: { createdAt: "asc" } });
    return ok(profiles);
  } catch (e) {
    return handleApiError(e);
  }
}
