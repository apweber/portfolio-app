import { requireAuth } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api-response";
import { profileUpdateSchema } from "@/lib/validations/profile";
import { prisma } from "@/lib/prisma";

export async function GET(): Promise<Response> {
  try {
    const profile = await requireAuth();
    return ok(profile);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: Request): Promise<Response> {
  try {
    const profile = await requireAuth();
    const body = await req.json();
    const data = profileUpdateSchema.parse(body);
    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data,
    });
    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}
