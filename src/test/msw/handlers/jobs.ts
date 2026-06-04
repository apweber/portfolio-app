import { http, HttpResponse } from "msw";

export const jobFixture = {
  id: "job-1",
  title: "Software Engineer",
  status: "APPLIED",
  fitScore: 72,
  tags: ["remote"],
  notes: "",
  description: "",
  companyId: "co-1",
  company: { name: "Acme Corp" },
  requiredSkills: ["TypeScript"],
  workPreference: "REMOTE",
  salaryRangeMin: "100000",
  salaryRangeMax: "140000",
  location: "San Francisco",
  postingUrl: "",
  applicationDate: "",
};

export const jobsHandlers = [
  http.get("/api/jobs/:id", ({ params }) => {
    return HttpResponse.json({ data: { ...jobFixture, id: params.id }, error: null });
  }),

  http.get("/api/jobs", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const sort = url.searchParams.get("sort");

    let items = [
      jobFixture,
      { ...jobFixture, id: "job-2", title: "Product Manager", status: "INTERVIEWING", fitScore: 55, company: { name: "Beta Inc" } },
      { ...jobFixture, id: "job-3", title: "Designer", status: "APPLIED", fitScore: 88, company: { name: "Gamma LLC" } },
    ];

    if (status) {
      items = items.filter((j) => j.status === status);
    }
    if (sort === "fitScore") {
      items = [...items].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
    }
    if (sort === "applicationDate") {
      items = [...items].sort((a, b) => a.title.localeCompare(b.title));
    }

    return HttpResponse.json({ data: { items, total: items.length, page: 1, limit: 20 }, error: null });
  }),

  http.post("/api/jobs", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      data: { ...jobFixture, id: "job-new", ...body },
      error: null,
    });
  }),

  http.patch("/api/jobs/:id", async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      data: { ...jobFixture, id: params.id, ...body },
      error: null,
    });
  }),
];
