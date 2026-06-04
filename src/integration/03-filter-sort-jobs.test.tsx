/**
 * Filter and sort jobs flow
 *
 * Renders the real JobsPage. MSW handles GET /api/jobs and returns different
 * fixtures based on query params, exercising the full filter/sort pipeline.
 */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import JobsPage from "@/app/(app)/jobs/page";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const allJobs = [
  { id: "job-1", title: "Software Engineer", status: "APPLIED", fitScore: 72, tags: [], company: { name: "Acme Corp" } },
  { id: "job-2", title: "Product Manager", status: "INTERVIEWING", fitScore: 55, tags: [], company: { name: "Beta Inc" } },
  { id: "job-3", title: "Designer", status: "APPLIED", fitScore: 88, tags: [], company: { name: "Gamma LLC" } },
];

function makeJobsHandler(jobs: typeof allJobs) {
  return http.get("/api/jobs", ({ request }) => {
    const sort = new URL(request.url).searchParams.get("sort");
    const items = sort === "fitScore"
      ? [...jobs].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0))
      : jobs;
    return HttpResponse.json({ data: { items, total: items.length, page: 1, limit: 20 }, error: null });
  });
}

function makeCompaniesHandler() {
  return http.get("/api/companies", () =>
    HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 100 }, error: null })
  );
}

describe("Filter and sort jobs flow", () => {
  beforeEach(() => {
    server.use(makeJobsHandler(allJobs), makeCompaniesHandler());
  });

  it("displays all jobs on initial load", async () => {
    render(<JobsPage />);
    await waitFor(() => expect(screen.getByText("Software Engineer")).toBeInTheDocument());
    expect(screen.getByText("Product Manager")).toBeInTheDocument();
    expect(screen.getByText("Designer")).toBeInTheDocument();
  });

  it("filters to APPLIED jobs when the Applied chip is clicked", async () => {
    const appliedJobs = allJobs.filter((j) => j.status === "APPLIED");
    server.use(
      http.get("/api/jobs", ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        const jobs = status === "APPLIED" ? appliedJobs : allJobs;
        return HttpResponse.json({ data: { items: jobs, total: jobs.length, page: 1, limit: 20 }, error: null });
      }),
      makeCompaniesHandler()
    );

    render(<JobsPage />);
    await waitFor(() => expect(screen.getByText("Software Engineer")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Applied" }));

    await waitFor(() => expect(screen.queryByText("Product Manager")).not.toBeInTheDocument());
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Designer")).toBeInTheDocument();
  });

  it("re-fetches when the status filter is toggled off", async () => {
    server.use(
      http.get("/api/jobs", ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        const jobs = status === "APPLIED" ? allJobs.filter((j) => j.status === "APPLIED") : allJobs;
        return HttpResponse.json({ data: { items: jobs, total: jobs.length, page: 1, limit: 20 }, error: null });
      }),
      makeCompaniesHandler()
    );

    render(<JobsPage />);
    await waitFor(() => expect(screen.getByText("Product Manager")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Applied" }));
    await waitFor(() => expect(screen.queryByText("Product Manager")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Applied" }));
    await waitFor(() => expect(screen.getByText("Product Manager")).toBeInTheDocument());
  });

  it("sorts by fitScore descending by default", async () => {
    render(<JobsPage />);
    await waitFor(() => expect(screen.getByText("Software Engineer")).toBeInTheDocument());

    const titles = screen.getAllByText(/Engineer|Manager|Designer/).map((el) => el.textContent);
    expect(titles[0]).toBe("Designer"); // fitScore 88 — highest
  });

  it("changes sort order when a different option is selected", async () => {
    server.use(
      http.get("/api/jobs", ({ request }) => {
        const url = new URL(request.url);
        const sort = url.searchParams.get("sort");
        const sorted =
          sort === "applicationDate"
            ? [...allJobs].sort((a, b) => a.title.localeCompare(b.title))
            : allJobs;
        return HttpResponse.json({ data: { items: sorted, total: sorted.length, page: 1, limit: 20 }, error: null });
      }),
      makeCompaniesHandler()
    );

    render(<JobsPage />);
    await waitFor(() => expect(screen.getByText("Software Engineer")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "applicationDate" } });

    await waitFor(() => {
      const titles = screen.getAllByText(/Engineer|Manager|Designer/).map((el) => el.textContent);
      expect(titles[0]).toBe("Designer"); // "D" alphabetically first
    });
  });

  it("shows empty state when no jobs match the filter", async () => {
    server.use(
      http.get("/api/jobs", () =>
        HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 20 }, error: null })
      ),
      makeCompaniesHandler()
    );
    render(<JobsPage />);
    await waitFor(() => expect(screen.getByText("No jobs found")).toBeInTheDocument());
  });
});
