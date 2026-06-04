import { http, HttpResponse } from "msw";

export const userFixtures = [
  { id: "user-1", name: "Alice Smith", email: "alice@example.com", role: "USER" },
  { id: "user-2", name: "Bob Jones", email: "bob@example.com", role: "ADMIN" },
];

export const adminHandlers = [
  http.get("/api/admin/users", () => {
    return HttpResponse.json({
      data: { items: userFixtures, total: 2, page: 1, limit: 50 },
      error: null,
    });
  }),

  http.patch("/api/admin/users/:id", async ({ params, request }) => {
    const body = await request.json() as { role: string };
    const user = userFixtures.find((u) => u.id === params.id);
    return HttpResponse.json({
      data: { ...user, role: body.role },
      error: null,
    });
  }),
];
