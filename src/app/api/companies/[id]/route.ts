import { requireAuth } from "@/lib/auth";
import { ok, errorResponse, handleApiError } from "@/lib/api-response";
import { companyUpdateSchema } from "@/lib/validations/company";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params): Promise<Response> {
  try {
    await requireAuth();
    const { id } = await params;
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return errorResponse(404, "NOT_FOUND", "Company not found");
    return ok(company);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: Request, { params }: Params): Promise<Response> {
  try {
    const profile = await requireAuth();
    const { id } = await params;
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return errorResponse(404, "NOT_FOUND", "Company not found");
    if (company.createdById !== profile.id && profile.role !== "ADMIN") {
      return errorResponse(403, "FORBIDDEN", "Insufficient permissions");
    }
    const body = await req.json();
    const data = companyUpdateSchema.parse(body);
    const updated = await prisma.company.update({ where: { id }, data });
    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params): Promise<Response> {
  try {
    const profile = await requireAuth();
    const { id } = await params;
    if (profile.role !== "ADMIN") {
      return errorResponse(403, "FORBIDDEN", "Insufficient permissions");
    }
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return errorResponse(404, "NOT_FOUND", "Company not found");
    await prisma.company.delete({ where: { id } });
    return ok({ id });
  } catch (e) {
    return handleApiError(e);
  }
}
