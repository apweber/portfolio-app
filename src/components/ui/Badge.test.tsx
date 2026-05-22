import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, scoreVariant } from "./Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies success variant class", () => {
    render(<Badge variant="success">Good</Badge>);
    expect(screen.getByText("Good")).toHaveClass("bg-green-100");
  });
});

describe("scoreVariant", () => {
  it("returns success for score >= 75", () => {
    expect(scoreVariant(75)).toBe("success");
    expect(scoreVariant(100)).toBe("success");
    expect(scoreVariant(90)).toBe("success");
  });

  it("returns warning for score 50–74", () => {
    expect(scoreVariant(50)).toBe("warning");
    expect(scoreVariant(74)).toBe("warning");
    expect(scoreVariant(60)).toBe("warning");
  });

  it("returns error for score < 50", () => {
    expect(scoreVariant(0)).toBe("error");
    expect(scoreVariant(49)).toBe("error");
  });

  it("returns default for null", () => {
    expect(scoreVariant(null)).toBe("default");
  });
});
