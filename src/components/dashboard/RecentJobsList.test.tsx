import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import { RecentJobsList } from "./RecentJobsList";

const makeJob = (i: number) => ({
  id: `j-${i}`,
  title: `Job ${i}`,
  status: "APPLIED",
  fitScore: i * 10,
  company: { name: "Acme Corp" },
});

describe("RecentJobsList", () => {
  it("renders up to 10 rows", () => {
    const jobs = Array.from({ length: 10 }, (_, i) => makeJob(i + 1));
    render(<RecentJobsList jobs={jobs} />);
    jobs.forEach((j) => expect(screen.getByText(j.title)).toBeInTheDocument());
  });

  it("shows status badge for each row", () => {
    render(<RecentJobsList jobs={[makeJob(1)]} />);
    expect(screen.getByText("Applied")).toBeInTheDocument();
  });

  it("shows fit score for each row", () => {
    render(<RecentJobsList jobs={[makeJob(8)]} />);
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("shows empty state when list is empty", () => {
    render(<RecentJobsList jobs={[]} />);
    expect(screen.getByText(/No jobs yet/)).toBeInTheDocument();
  });
});
