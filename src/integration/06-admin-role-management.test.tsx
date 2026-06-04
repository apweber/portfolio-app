/**
 * Admin role management flow
 *
 * Renders UserTable with two users. The onRoleChange handler calls
 * PATCH /api/admin/users/:id through the real API client; MSW intercepts
 * and records the request. The confirm() dialog is stubbed to always accept.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { patch } from "@/lib/api";
import { UserTable } from "@/components/admin/UserTable";

const users = [
  { id: "user-1", name: "Alice Smith", email: "alice@example.com", role: "USER" },
  { id: "user-2", name: "Bob Jones", email: "bob@example.com", role: "ADMIN" },
];

describe("Admin role management flow", () => {
  beforeEach(() => {
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders all users with their current roles", () => {
    render(<UserTable users={users} onRoleChange={vi.fn()} />);
    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    const aliceSelect = screen.getByRole("combobox", { name: /role for alice smith/i }) as HTMLSelectElement;
    expect(aliceSelect.value).toBe("USER");
    const bobSelect = screen.getByRole("combobox", { name: /role for bob jones/i }) as HTMLSelectElement;
    expect(bobSelect.value).toBe("ADMIN");
  });

  it("PATCHes /api/admin/users/:id when role is changed", async () => {
    let captured: unknown;
    server.use(
      http.patch("/api/admin/users/user-1", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ data: { ...users[0], role: "ADMIN" }, error: null });
      })
    );

    const onRoleChange = async (userId: string, newRole: string) => {
      await patch(`/api/admin/users/${userId}`, { role: newRole });
    };

    render(<UserTable users={users} onRoleChange={onRoleChange} />);

    fireEvent.change(screen.getByRole("combobox", { name: /role for alice smith/i }), {
      target: { value: "ADMIN" },
    });

    await waitFor(() => expect(captured).toMatchObject({ role: "ADMIN" }));
  });

  it("shows a confirmation dialog before changing the role", () => {
    const confirmSpy = vi.mocked(globalThis.confirm);
    render(<UserTable users={users} onRoleChange={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox", { name: /role for alice smith/i }), {
      target: { value: "ADMIN" },
    });

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("Alice Smith")
    );
  });

  it("does not call onRoleChange when the user cancels the confirmation", async () => {
    vi.mocked(globalThis.confirm).mockReturnValue(false);
    const onRoleChange = vi.fn();

    render(<UserTable users={users} onRoleChange={onRoleChange} />);

    fireEvent.change(screen.getByRole("combobox", { name: /role for alice smith/i }), {
      target: { value: "ADMIN" },
    });

    await waitFor(() => expect(onRoleChange).not.toHaveBeenCalled());
  });

  it("renders empty state when no users are provided", () => {
    render(<UserTable users={[]} onRoleChange={vi.fn()} />);
    expect(screen.getByText("No users found.")).toBeInTheDocument();
  });
});
