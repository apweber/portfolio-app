import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, ApiClientError, get, post } from "./api";

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

describe("apiFetch", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns data on a success envelope", async () => {
    mockFetch({ data: { id: "1" }, error: null });
    const result = await apiFetch<{ id: string }>("/api/test");
    expect(result).toEqual({ id: "1" });
  });

  it("throws ApiClientError on an error envelope", async () => {
    mockFetch({ data: null, error: { code: "NOT_FOUND", message: "Not found" } }, 404);
    await expect(apiFetch("/api/test")).rejects.toThrow(ApiClientError);
  });

  it("ApiClientError carries code and message", async () => {
    mockFetch({ data: null, error: { code: "UNAUTHORIZED", message: "Auth required" } }, 401);
    try {
      await apiFetch("/api/test");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiClientError);
      expect((e as ApiClientError).code).toBe("UNAUTHORIZED");
      expect((e as ApiClientError).message).toBe("Auth required");
    }
  });

  it("get() calls fetch with no body", async () => {
    const spy = mockFetch({ data: [], error: null });
    await get("/api/items");
    expect(spy).toHaveBeenCalledWith("/api/items", expect.objectContaining({ headers: expect.any(Object) }));
  });

  it("post() calls fetch with JSON body and POST method", async () => {
    const spy = mockFetch({ data: { id: "2" }, error: null });
    await post("/api/items", { name: "test" });
    expect(spy).toHaveBeenCalledWith(
      "/api/items",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "test" }) })
    );
  });
});
