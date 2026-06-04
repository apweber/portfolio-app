import { http, HttpResponse } from "msw";

export const companyFixture = {
  id: "co-1",
  name: "Acme Corp",
  industry: "Technology",
  size: "100-500",
  location: "San Francisco, CA",
  website: "https://acme.example.com",
  cultureNotes: "",
};

export const companiesHandlers = [
  http.get("/api/companies", () => {
    return HttpResponse.json({
      data: { items: [companyFixture], total: 1, page: 1, limit: 100 },
      error: null,
    });
  }),

  http.post("/api/companies", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      data: { ...companyFixture, id: "co-new", ...body },
      error: null,
    });
  }),
];
