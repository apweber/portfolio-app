/**
 * Interview notes persistence flow
 *
 * Renders JobForm in edit mode pre-filled with a job fixture. The onSubmit
 * handler calls PATCH /api/jobs/:id through the real API client; MSW
 * intercepts and records the request body so we can assert the notes were
 * saved correctly.
 */
import { vi, describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { patch } from "@/lib/api";
import { JobForm, type JobFormInput } from "@/components/jobs/JobForm";

const companies = [{ id: "co-1", name: "Acme Corp" }];

const existingJob: Partial<JobFormInput> = {
  companyId: "co-1",
  title: "Frontend Engineer",
  status: "INTERVIEWING",
  notes: "Initial call went well.",
  description: "Build React components.",
  requiredSkills: ["TypeScript"],
  tags: [],
  workPreference: "REMOTE",
  salaryRangeMin: "100000",
  salaryRangeMax: "130000",
  location: "Remote",
  postingUrl: "",
  applicationDate: "",
};

describe("Interview notes persistence flow", () => {
  it("pre-fills the notes field with existing job data", () => {
    render(
      <JobForm
        companies={companies}
        initialValues={existingJob}
        onSubmit={vi.fn()}
        submitLabel="Update Job"
      />
    );
    expect((screen.getByLabelText(/Notes/i) as HTMLTextAreaElement).value).toBe(
      "Initial call went well."
    );
  });

  it("PATCHes /api/jobs/:id with updated notes on submit", async () => {
    let captured: unknown;
    server.use(
      http.patch("/api/jobs/job-1", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ data: { id: "job-1" }, error: null });
      })
    );

    const onSubmit = async (data: JobFormInput) => {
      await patch("/api/jobs/job-1", data);
    };

    render(
      <JobForm
        companies={companies}
        initialValues={existingJob}
        onSubmit={onSubmit}
        submitLabel="Update Job"
      />
    );

    const notesField = screen.getByLabelText(/Notes/i) as HTMLTextAreaElement;
    fireEvent.change(notesField, {
      target: { value: "Second interview scheduled for next Thursday." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Job" }));

    await waitFor(() =>
      expect(captured).toMatchObject({
        notes: "Second interview scheduled for next Thursday.",
        title: "Frontend Engineer",
        companyId: "co-1",
      })
    );
  });

  it("persists status change alongside notes update", async () => {
    let captured: unknown;
    server.use(
      http.patch("/api/jobs/job-1", async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ data: { id: "job-1" }, error: null });
      })
    );

    const onSubmit = async (data: JobFormInput) => {
      await patch("/api/jobs/job-1", data);
    };

    render(
      <JobForm
        companies={companies}
        initialValues={existingJob}
        onSubmit={onSubmit}
        submitLabel="Update Job"
      />
    );

    fireEvent.change(screen.getByLabelText(/^Status$/i), { target: { value: "OFFER" } });
    fireEvent.change(screen.getByLabelText(/Notes/i), {
      target: { value: "Offer received: $120k base." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Job" }));

    await waitFor(() =>
      expect(captured).toMatchObject({
        status: "OFFER",
        notes: "Offer received: $120k base.",
      })
    );
  });
});
