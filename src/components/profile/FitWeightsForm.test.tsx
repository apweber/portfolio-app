import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/api", () => ({
  put: vi.fn(),
}));

vi.mock("@/components/providers/ToastProvider", () => ({
  useToast: () => ({ show: vi.fn() }),
}));

import { put } from "@/lib/api";
import { FitWeightsForm } from "./FitWeightsForm";

const validWeights = { skillsWeight: 40, salaryWeight: 30, remoteWeight: 20, locationWeight: 10 };
const invalidWeights = { skillsWeight: 40, salaryWeight: 30, remoteWeight: 20, locationWeight: 5 };

describe("FitWeightsForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the running total", () => {
    render(<FitWeightsForm initialWeights={validWeights} />);
    expect(screen.getByText("Total: 100/100")).toBeInTheDocument();
  });

  it("enables Save when total is exactly 100", () => {
    render(<FitWeightsForm initialWeights={validWeights} />);
    expect(screen.getByRole("button", { name: "Save Weights" })).not.toBeDisabled();
  });

  it("disables Save when total is not 100", () => {
    render(<FitWeightsForm initialWeights={invalidWeights} />);
    expect(screen.getByRole("button", { name: "Save Weights" })).toBeDisabled();
  });

  it("calls PUT /api/fit-weights with the current weights on save", async () => {
    vi.mocked(put).mockResolvedValue(validWeights as any);
    render(<FitWeightsForm initialWeights={validWeights} />);
    fireEvent.click(screen.getByRole("button", { name: "Save Weights" }));
    await waitFor(() => expect(put).toHaveBeenCalledWith("/api/fit-weights", validWeights));
  });
});
