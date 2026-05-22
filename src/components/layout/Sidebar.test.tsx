import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/dashboard"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("Sidebar", () => {
  it("renders all standard navigation links", () => {
    render(<Sidebar role="USER" />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Companies" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jobs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
  });

  it("does not show Admin link for USER role", () => {
    render(<Sidebar role="USER" />);
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("shows Admin link for ADMIN role", () => {
    render(<Sidebar role="ADMIN" />);
    expect(screen.getByRole("link", { name: "Admin" })).toBeInTheDocument();
  });

  it("highlights the active route", () => {
    render(<Sidebar role="USER" />);
    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink).toHaveClass("bg-blue-50");
  });

  it("does not highlight inactive routes", () => {
    render(<Sidebar role="USER" />);
    const companiesLink = screen.getByRole("link", { name: "Companies" });
    expect(companiesLink).not.toHaveClass("bg-blue-50");
  });
});
