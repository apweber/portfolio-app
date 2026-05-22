import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

vi.mock("@/lib/api", () => ({ get: vi.fn() }));
vi.mock("@/components/providers/ToastProvider", () => ({ useToast: () => ({ show: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, className }: any) => <a href={href} className={className}>{children}</a>,
}));

import { get } from "@/lib/api";
import CompaniesPage from "./page";

const emptyResult = { items: [], total: 0, page: 1, limit: 20 };
const oneResult = {
  items: [{ id: "co-1", name: "Acme Corp", industry: "Tech", location: null, size: null }],
  total: 1, page: 1, limit: 20,
};

describe("CompaniesPage — render", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls GET /api/companies on mount", async () => {
    vi.mocked(get).mockResolvedValue(emptyResult as any);
    render(<CompaniesPage />);
    await waitFor(() => expect(get).toHaveBeenCalledWith(expect.stringContaining("/api/companies")));
  });

  it("renders company cards when results are returned", async () => {
    vi.mocked(get).mockResolvedValue(oneResult as any);
    render(<CompaniesPage />);
    await waitFor(() => expect(screen.getByText("Acme Corp")).toBeInTheDocument());
  });

  it("shows empty state when no results", async () => {
    vi.mocked(get).mockResolvedValue(emptyResult as any);
    render(<CompaniesPage />);
    await waitFor(() => expect(screen.getByText("No companies found")).toBeInTheDocument());
  });
});

describe("CompaniesPage — debounce", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(get).mockResolvedValue(emptyResult as any);
  });
  afterEach(() => vi.useRealTimers());

  it("does not call GET immediately after typing", async () => {
    render(<CompaniesPage />);
    // Flush the initial mount fetch
    await act(async () => { vi.runAllTimers(); });
    vi.mocked(get).mockClear();

    fireEvent.change(screen.getByLabelText("Search companies"), { target: { value: "acme" } });
    expect(get).not.toHaveBeenCalled();
  });

  it("calls GET with q param after 300ms debounce", async () => {
    render(<CompaniesPage />);
    await act(async () => { vi.runAllTimers(); });
    vi.mocked(get).mockClear();

    fireEvent.change(screen.getByLabelText("Search companies"), { target: { value: "acme" } });
    await act(async () => { vi.advanceTimersByTime(300); });

    expect(get).toHaveBeenCalledWith(expect.stringContaining("q=acme"));
  });
});
