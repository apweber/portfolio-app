import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CompanyForm } from "./CompanyForm";

describe("CompanyForm", () => {
  const onSubmit = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("renders the name field", () => {
    render(<CompanyForm onSubmit={onSubmit} />);
    expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
  });

  it("shows a validation error when name is empty and form is submitted", async () => {
    render(<CompanyForm onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByText("Company name is required")).toBeInTheDocument()
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the payload when name is provided via initialValues", async () => {
    onSubmit.mockResolvedValue(undefined);
    render(
      <CompanyForm
        initialValues={{ name: "Acme Corp", industry: "Tech" }}
        onSubmit={onSubmit}
      />
    );
    // Confirm the value is in the DOM
    expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Acme Corp", industry: "Tech" }),
        expect.anything()
      )
    );
  });

  it("pre-fills fields from initialValues", () => {
    render(
      <CompanyForm
        initialValues={{ name: "Existing Co", industry: "Finance" }}
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByDisplayValue("Existing Co")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Finance")).toBeInTheDocument();
  });

  it("renders with a custom submit label", () => {
    render(<CompanyForm onSubmit={onSubmit} submitLabel="Create Company" />);
    expect(screen.getByRole("button", { name: "Create Company" })).toBeInTheDocument();
  });
});
