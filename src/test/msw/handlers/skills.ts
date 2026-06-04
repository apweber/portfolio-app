import { http, HttpResponse } from "msw";

export const skillsHandlers = [
  http.post("/api/skills", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      data: { id: "skill-new", name: body.name, proficiency: body.proficiency ?? "INTERMEDIATE" },
      error: null,
    });
  }),

  http.delete("/api/skills/:id", () => {
    return HttpResponse.json({ data: {}, error: null });
  }),
];
