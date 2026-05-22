import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UserTable } from "./UserTable";

const users = [
  { id: "u-1", name: "Alice", email: "alice@example.com", role: "USER" },
  { id: "u-2", name: "Bob", email: "bob@example.com", role: "ADMIN" },
];

describe("UserTable", () => {
  const onRoleChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("renders a row per user", () => {
    render(<UserTable users={users} onRoleChange={onRoleChange} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("calls onRoleChange with userId and new role when confirmed", () => {
    render(<UserTable users={users} onRoleChange={onRoleChange} />);
    fireEvent.change(screen.getByLabelText("Role for Alice"), {
      target: { value: "ADMIN" },
    });
    expect(onRoleChange).toHaveBeenCalledWith("u-1", "ADMIN");
  });

  it("does not call onRoleChange when confirm is cancelled", () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    render(<UserTable users={users} onRoleChange={onRoleChange} />);
    fireEvent.change(screen.getByLabelText("Role for Alice"), {
      target: { value: "ADMIN" },
    });
    expect(onRoleChange).not.toHaveBeenCalled();
  });

  it("shows empty state when no users", () => {
    render(<UserTable users={[]} onRoleChange={onRoleChange} />);
    expect(screen.getByText("No users found.")).toBeInTheDocument();
  });
});
