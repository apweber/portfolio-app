import { requireAuth } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api-response";
import { companyCreateSchema } from "@/lib/validations/company";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request): Promise<Response> {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10));
    const skip = (page - 1) * limit;

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { industry: { contains: q, mode: "insensitive" as const } },
            { location: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.company.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
      prisma.company.count({ where }),
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
    const data = companyCreateSchema.parse(body);
    const company = await prisma.company.create({
      data: { ...data, createdById: profile.id },
    });
    return ok(company, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
