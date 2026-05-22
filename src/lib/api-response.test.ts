import { describe, it, expect } from "vitest";
import { z, ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ok, errorResponse, handleApiError } from "@/lib/api-response";

describe("ok", () => {
  it("returns 200 with data envelope by default", async () => {
    const res = ok({ id: 1 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: { id: 1 }, error: null });
  });

  it("respects a custom status code", async () => {
    const res = ok({ id: 2 }, 201);
    expect(res.status).toBe(201);
  });
});

describe("errorResponse", () => {
  it("returns the error envelope", async () => {
    const res = errorResponse(400, "BAD_REQUEST", "Bad input");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ data: null, error: { code: "BAD_REQUEST", message: "Bad input" } });
  });

  it("includes details when provided", async () => {
    const res = errorResponse(400, "BAD_REQUEST", "Bad input", { field: "name" });
    const body = await res.json();
    expect(body.error.details).toEqual({ field: "name" });
  });

  it("omits details key when not provided", async () => {
    const res = errorResponse(400, "CODE", "msg");
    const body = await res.json();
    expect("details" in body.error).toBe(false);
  });
});

describe("handleApiError", () => {
  it("maps ZodError to 400 VALIDATION_ERROR", async () => {
    let err: unknown;
    try {
      z.object({ name: z.string() }).parse({ name: 123 });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ZodError);
    const res = handleApiError(err);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
  });

  it("maps Prisma P2002 to 409 DUPLICATE", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "7.0.0",
    });
    const res = handleApiError(err);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("DUPLICATE");
  });

  it("maps Prisma P2025 to 404 NOT_FOUND", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "7.0.0",
    });
    const res = handleApiError(err);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 500 for unknown errors", async () => {
    const res = handleApiError(new Error("boom"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
