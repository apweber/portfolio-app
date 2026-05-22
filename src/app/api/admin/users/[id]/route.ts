import { requireAdmin } from "@/lib/auth";
import { ok, errorResponse, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const roleSchema = z.object({ role: z.enum(["USER", "ADMIN"]) });

export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { role } = roleSchema.parse(body);
    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing) return errorResponse(404, "NOT_FOUND", "User not found");
    const profile = await prisma.profile.update({ where: { id }, data: { role } });
    return ok(profile);
  } catch (e) {
    return handleApiError(e);
  }
}
