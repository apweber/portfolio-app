import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, className, "aria-label": ariaLabel }: any) => (
    <a href={href} className={className} aria-label={ariaLabel}>{children}</a>
  ),
}));

import { ApplicationStatusSummary } from "./ApplicationStatusSummary";

describe("ApplicationStatusSummary", () => {
  const counts = { APPLIED: 3, PHONE_SCREEN: 1, INTERVIEWING: 2, OFFER: 0, REJECTED: 5 };

  it("renders a count for each status", () => {
    render(<ApplicationStatusSummary counts={counts} />);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("links carry the status filter in href", () => {
    render(<ApplicationStatusSummary counts={counts} />);
    expect(screen.getByRole("link", { name: /Applied: 3 jobs/ })).toHaveAttribute(
      "href",
      "/jobs?status=APPLIED"
    );
    expect(screen.getByRole("link", { name: /Interviewing: 2 jobs/ })).toHaveAttribute(
      "href",
      "/jobs?status=INTERVIEWING"
    );
  });

  it("shows 0 for missing statuses", () => {
    render(<ApplicationStatusSummary counts={{}} />);
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(5);
  });
});
