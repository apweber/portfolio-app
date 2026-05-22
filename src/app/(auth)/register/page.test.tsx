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

function makeMockClient(signUpResult = { data: { user: {} }, error: null }) {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue(signUpResult),
    },
  };
}

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as any);
  });

  it("renders email and password inputs and a register button", () => {
    vi.mocked(createClient).mockReturnValue(makeMockClient() as any);
    render(<RegisterPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows validation errors when form is submitted empty", async () => {
    vi.mocked(createClient).mockReturnValue(makeMockClient() as any);
    render(<RegisterPage />);
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    });
  });

  it("calls signUp with the entered credentials", async () => {
    const mockClient = makeMockClient();
    vi.mocked(createClient).mockReturnValue(mockClient as any);
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "bob@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockClient.auth.signUp).toHaveBeenCalledWith({
        email: "bob@example.com",
        password: "securepass123",
      });
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows a form-level error when registration fails", async () => {
    const mockClient = makeMockClient({
      data: { user: null },
      error: { message: "Email already registered" } as any,
    });
    vi.mocked(createClient).mockReturnValue(mockClient as any);

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "bob@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "securepass123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() =>
      expect(screen.getByText("Email already registered")).toBeInTheDocument()
    );
  });
});
