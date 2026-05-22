import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FitScoreBadge } from "./FitScoreBadge";

describe("FitScoreBadge", () => {
  it("shows '–' for null score", () => {
    render(<FitScoreBadge score={null} />);
    expect(screen.getByText("–")).toBeInTheDocument();
  });

  it("renders the score number", () => {
    render(<FitScoreBadge score={80} />);
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("applies success class for score >= 75", () => {
    const { container } = render(<FitScoreBadge score={80} />);
    expect(container.firstChild).toHaveClass("bg-green-100");
  });

  it("applies warning class for score 50–74", () => {
    const { container } = render(<FitScoreBadge score={60} />);
    expect(container.firstChild).toHaveClass("bg-yellow-100");
  });

  it("applies error class for score < 50", () => {
    const { container } = render(<FitScoreBadge score={30} />);
    expect(container.firstChild).toHaveClass("bg-red-100");
  });
});
