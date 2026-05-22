import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";

export type ApiSuccess<T> = { data: T; error: null };
export type ApiError = {
  data: null;
  error: { code: string; message: string; details?: unknown };
};

export function ok<T>(data: T, status = 200): Response {
  const body: ApiSuccess<T> = { data, error: null };
  return NextResponse.json(body, { status });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  const body: ApiError = {
    data: null,
    error: details !== undefined ? { code, message, details } : { code, message },
  };
  return NextResponse.json(body, { status });
}

export function handleApiError(e: unknown): Response {
  if (e instanceof ZodError) {
    return errorResponse(400, "VALIDATION_ERROR", "Validation failed", e.flatten());
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      return errorResponse(409, "DUPLICATE", "Resource already exists");
    }
    if (e.code === "P2025") {
      return errorResponse(404, "NOT_FOUND", "Resource not found");
    }
  }
  console.error(e);
  return errorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred");
}
