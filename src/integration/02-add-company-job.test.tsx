/**
 * Add company + job flow
 *
 * Renders the real CompanyForm and JobForm components. API calls go through
 * the real @/lib/api client; MSW intercepts them at the network layer.
 */
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { post } from "@/lib/api";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { JobForm } from "@/components/jobs/JobForm";

const companies = [{ id: "co-1", name: "Acme Corp" }];

describe("Add company flow", () => {
  it("submits company form and POST /api/companies is called with correct fields", async () => {
    let captured: unknown;
    server.use(
      http.post("/api/companies", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ data: { id: "co-new", name: "NewCo" }, error: null });
      })
    );

    const onSubmit = async (data: Parameters<typeof post>[1]) => {
      await post("/api/companies", data);
    };

    render(<CompanyForm onSubmit={onSubmit} submitLabel="Create Company" />);

    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: "NewCo" } });
    fireEvent.change(screen.getByLabelText(/website/i), { target: { value: "https://newco.example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Company" }));

    await waitFor(() =>
      expect(captured).toMatchObject({ name: "NewCo", website: "https://newco.example.com" })
    );
  });

  it("shows validation error when company name is empty", async () => {
    render(<CompanyForm onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByText("Company name is required")).toBeInTheDocument()
    );
  });
});

describe("Add job flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits job form and POST /api/jobs is called with correct fields", async () => {
    let captured: unknown;
    server.use(
      http.post("/api/jobs", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ data: { id: "job-new" }, error: null });
      })
    );

    const onSubmit = async (data: Parameters<typeof post>[1]) => {
      await post("/api/jobs", data);
    };

    render(<JobForm companies={companies} onSubmit={onSubmit} submitLabel="Add Job" />);

    fireEvent.change(screen.getByLabelText(/Company \*/i), { target: { value: "co-1" } });
    fireEvent.change(screen.getByLabelText(/Title \*/i), { target: { value: "Frontend Engineer" } });

    const skillInput = screen.getByLabelText(/Required Skills/i);
    fireEvent.change(skillInput, { target: { value: "TypeScript" } });
    fireEvent.keyDown(skillInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Add Job" }));

    await waitFor(() =>
      expect(captured).toMatchObject({
        companyId: "co-1",
        title: "Frontend Engineer",
        requiredSkills: ["TypeScript"],
      })
    );
  });

  it("shows validation error when no company is selected", async () => {
    render(<JobForm companies={companies} onSubmit={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByText("Company is required")).toBeInTheDocument()
    );
  });
});
