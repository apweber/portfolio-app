import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/api", () => ({ get: vi.fn(), del: vi.fn() }));
vi.mock("@/components/providers/ToastProvider", () => ({
  useToast: () => ({ show: vi.fn() }),
}));

import { get, del } from "@/lib/api";
import AdminJobsPage from "./page";

const jobs = [
  {
    id: "j-1",
    title: "Software Engineer",
    status: "APPLIED",
    fitScore: 80,
    company: { name: "Acme Corp" },
    profile: { email: "alice@example.com" },
  },
];

describe("AdminJobsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders job rows", async () => {
    vi.mocked(get).mockResolvedValue({ items: jobs } as any);
    render(<AdminJobsPage />);
    await waitFor(() => expect(screen.getByText("Software Engineer")).toBeInTheDocument());
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("calls DELETE and removes the row when confirmed", async () => {
    vi.mocked(get).mockResolvedValue({ items: jobs } as any);
    vi.mocked(del).mockResolvedValue(undefined as any);
    render(<AdminJobsPage />);
    await waitFor(() => expect(screen.getByText("Software Engineer")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(del).toHaveBeenCalledWith(expect.stringContaining("/api/admin/jobs/j-1"))
    );
    await waitFor(() =>
      expect(screen.queryByText("Software Engineer")).not.toBeInTheDocument()
    );
  });

  it("does not call DELETE when confirm is cancelled", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    vi.mocked(get).mockResolvedValue({ items: jobs } as any);
    render(<AdminJobsPage />);
    await waitFor(() => expect(screen.getByText("Software Engineer")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(del).not.toHaveBeenCalled();
  });
});
