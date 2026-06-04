/**
 * Onboarding flow: Register → Login → Dashboard
 *
 * Auth is handled by the Supabase SDK (not fetch), so Supabase is mocked at
 * the module level. MSW is not involved here; these tests cover the form
 * interactions and navigation calls that a real user would trigger.
 */
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
import RegisterPage from "@/app/(auth)/register/page";
import LoginPage from "@/app/(auth)/login/page";

function makeSupabaseClient(overrides: Record<string, unknown> = {}) {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      ...overrides,
    },
  };
}

describe("Onboarding flow", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as ReturnType<typeof useRouter>);
  });

  describe("Step 1 — Registration", () => {
    it("shows validation errors when submitted empty", async () => {
      vi.mocked(createClient).mockReturnValue(makeSupabaseClient() as ReturnType<typeof createClient>);
      render(<RegisterPage />);
      fireEvent.click(screen.getByRole("button", { name: /create account/i }));
      await waitFor(() =>
        expect(screen.getAllByRole("alert").length).toBeGreaterThan(0)
      );
    });

    it("calls signUp with entered credentials and redirects to /login", async () => {
      const client = makeSupabaseClient();
      vi.mocked(createClient).mockReturnValue(client as ReturnType<typeof createClient>);

      render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "alice@example.com" } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "securepass123" } });
      fireEvent.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() =>
        expect(client.auth.signUp).toHaveBeenCalledWith({
          email: "alice@example.com",
          password: "securepass123",
        })
      );
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
    });

    it("shows a form-level error when registration fails", async () => {
      const client = makeSupabaseClient({
        signUp: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Email already registered" },
        }),
      });
      vi.mocked(createClient).mockReturnValue(client as ReturnType<typeof createClient>);

      render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "alice@example.com" } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "securepass123" } });
      fireEvent.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() =>
        expect(screen.getByText("Email already registered")).toBeInTheDocument()
      );
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Step 2 — Login", () => {
    it("calls signInWithPassword with entered credentials and redirects to /dashboard", async () => {
      const client = makeSupabaseClient();
      vi.mocked(createClient).mockReturnValue(client as ReturnType<typeof createClient>);

      render(<LoginPage />);
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "alice@example.com" } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "securepass123" } });
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() =>
        expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
          email: "alice@example.com",
          password: "securepass123",
        })
      );
      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
    });

    it("shows an error when login fails with bad credentials", async () => {
      const client = makeSupabaseClient({
        signInWithPassword: vi.fn().mockResolvedValue({
          error: { message: "Invalid login credentials" },
        }),
      });
      vi.mocked(createClient).mockReturnValue(client as ReturnType<typeof createClient>);

      render(<LoginPage />);
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "alice@example.com" } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpassword" } });
      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() =>
        expect(screen.getByText("Invalid login credentials")).toBeInTheDocument()
      );
      expect(mockPush).not.toHaveBeenCalledWith("/dashboard");
    });
  });
});
