import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/api", () => ({ get: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import { get } from "@/lib/api";
import JobsPage from "./page";

const emptyJobs = { items: [], total: 0, page: 1, limit: 20 };
const emptyCompanies = { items: [], total: 0, page: 1, limit: 100 };
const oneJob = {
  items: [
    {
      id: "j-1",
      title: "Software Engineer",
      status: "APPLIED",
      fitScore: 80,
      tags: ["remote"],
      company: { name: "Acme Corp" },
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
};

describe("JobsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET /api/jobs on mount", async () => {
    vi.mocked(get).mockResolvedValue(emptyJobs as any);
    render(<JobsPage />);
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith(expect.stringContaining("/api/jobs"))
    );
  });

  it("renders job cards when results are returned", async () => {
    vi.mocked(get).mockImplementation((url: string) => {
      if (url.includes("/api/companies")) return Promise.resolve(emptyCompanies as any);
      return Promise.resolve(oneJob as any);
    });
    render(<JobsPage />);
    await waitFor(() =>
      expect(screen.getByText("Software Engineer")).toBeInTheDocument()
    );
  });

  it("shows empty state when no jobs", async () => {
    vi.mocked(get).mockResolvedValue(emptyJobs as any);
    render(<JobsPage />);
    await waitFor(() =>
      expect(screen.getByText("No jobs found")).toBeInTheDocument()
    );
  });

  it("calls GET with status param when a status chip is clicked", async () => {
    vi.mocked(get).mockResolvedValue(emptyJobs as any);
    render(<JobsPage />);
    await waitFor(() => expect(get).toHaveBeenCalled());
    vi.mocked(get).mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Applied" }));
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith(expect.stringContaining("status=APPLIED"))
    );
  });

  it("calls GET with sort param when sort is changed", async () => {
    vi.mocked(get).mockResolvedValue(emptyJobs as any);
    render(<JobsPage />);
    await waitFor(() => expect(get).toHaveBeenCalled());
    vi.mocked(get).mockClear();

    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: { value: "applicationDate" },
    });
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith(expect.stringContaining("sort=applicationDate"))
    );
  });
});
