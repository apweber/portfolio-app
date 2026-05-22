import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/api", () => ({
  patch: vi.fn(),
}));

vi.mock("@/components/providers/ToastProvider", () => ({
  useToast: () => ({ show: vi.fn() }),
}));

import { patch } from "@/lib/api";
import { ProfileInfoForm } from "./ProfileInfoForm";

const initialProfile = {
  name: "Alice",
  targetSalary: null,
  workPreference: null as null,
  preferredLocation: null,
};

describe("ProfileInfoForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders with the initial profile name", () => {
    render(<ProfileInfoForm initialProfile={initialProfile} />);
    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
  });

  it("calls PATCH /api/profile on submit with form data", async () => {
    vi.mocked(patch).mockResolvedValue({ ...initialProfile, name: "Alice" } as any);
    render(<ProfileInfoForm initialProfile={initialProfile} />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        "/api/profile",
        expect.objectContaining({ name: "Alice" })
      )
    );
  });

  it("shows a validation error when name is cleared and form is submitted", async () => {
    render(<ProfileInfoForm initialProfile={initialProfile} />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(patch).not.toHaveBeenCalled());
  });
});
