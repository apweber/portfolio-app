import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LoginPage from "@/app/(auth)/login/page";

function makeMockClient(signInResult = { error: null }) {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue(signInResult),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as any);
  });

  it("renders email, password inputs and the sign-in button", () => {
    vi.mocked(createClient).mockReturnValue(makeMockClient() as any);
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows validation errors when form is submitted empty", async () => {
    vi.mocked(createClient).mockReturnValue(makeMockClient() as any);
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
  });

  it("calls signInWithPassword with the entered credentials", async () => {
    const mockClient = makeMockClient();
    vi.mocked(createClient).mockReturnValue(mockClient as any);
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "alice@example.com",
        password: "password123",
      });
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });

  it("displays a form-level error when sign-in fails", async () => {
    const mockClient = makeMockClient({ error: { message: "Invalid credentials" } as any });
    vi.mocked(createClient).mockReturnValue(mockClient as any);

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument()
    );
  });
});
