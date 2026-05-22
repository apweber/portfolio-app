import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { JobForm } from "./JobForm";

const companies = [
  { id: "co-1", name: "Acme Corp" },
  { id: "co-2", name: "Beta Inc" },
];

describe("JobForm", () => {
  const onSubmit = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("renders company and title fields", () => {
    render(<JobForm companies={companies} onSubmit={onSubmit} />);
    expect(screen.getByLabelText(/Company/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
  });

  it("shows validation error when company is not selected", async () => {
    render(<JobForm companies={companies} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByText("Company is required")).toBeInTheDocument()
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error when title is empty", async () => {
    render(<JobForm companies={companies} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/Company/), { target: { value: "co-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByText("Title is required")).toBeInTheDocument()
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits with requiredSkills and tags arrays", async () => {
    onSubmit.mockResolvedValue(undefined);
    render(<JobForm companies={companies} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/Company/), { target: { value: "co-1" } });
    fireEvent.change(screen.getByLabelText(/Title/), { target: { value: "Engineer" } });

    const skillInput = screen.getByLabelText(/Required Skills/);
    fireEvent.change(skillInput, { target: { value: "TypeScript" } });
    fireEvent.keyDown(skillInput, { key: "Enter" });

    const tagInput = screen.getByLabelText(/^Tags$/);
    fireEvent.change(tagInput, { target: { value: "remote" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: "co-1",
          title: "Engineer",
          requiredSkills: ["TypeScript"],
          tags: ["remote"],
        }),
        expect.anything()
      )
    );
  });

  it("renders with a custom submit label", () => {
    render(<JobForm companies={companies} onSubmit={onSubmit} submitLabel="Add Job" />);
    expect(screen.getByRole("button", { name: "Add Job" })).toBeInTheDocument();
  });
});
