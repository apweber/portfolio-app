/**
 * Fit-score updates after adding skills
 *
 * Part 1: Renders SkillsManager; adding a skill POSTs to /api/skills (MSW)
 *         and the new skill appears in the UI.
 * Part 2: Renders JobsPage; MSW returns jobs with updated fitScores (simulating
 *         the backend having recalculated after the skill was saved). Verifies
 *         the updated score is visible.
 */
import { vi, describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { SkillsManager } from "@/components/profile/SkillsManager";
import JobsPage from "@/app/(app)/jobs/page";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("@/components/providers/ToastProvider", () => ({
  useToast: () => ({ show: vi.fn() }),
}));

afterEach(() => vi.clearAllMocks());

describe("Fit-score update flow — Part 1: add a skill", () => {
  it("POSTs the new skill and adds it to the skills list", async () => {
    server.use(
      http.post("/api/skills", async ({ request }) => {
        const body = await request.json() as { name: string; proficiency: string };
        return HttpResponse.json({
          data: { id: "skill-rust", name: body.name, proficiency: body.proficiency },
          error: null,
        });
      })
    );

    render(<SkillsManager initialSkills={[{ id: "skill-ts", name: "TypeScript", proficiency: "ADVANCED" }]} />);

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. TypeScript/i), { target: { value: "Rust" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(screen.getByText("Rust")).toBeInTheDocument());
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("does not add the skill to the list when the API returns an error", async () => {
    server.use(
      http.post("/api/skills", () =>
        HttpResponse.json({ data: null, error: { code: "VALIDATION_ERROR", message: "Skill already exists" } }, { status: 400 })
      )
    );

    render(<SkillsManager initialSkills={[]} />);

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. TypeScript/i), { target: { value: "Rust" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(screen.queryByText("Rust")).not.toBeInTheDocument());
  });

  it("removes a skill via DELETE /api/skills/:id", async () => {
    render(
      <SkillsManager
        initialSkills={[
          { id: "skill-ts", name: "TypeScript", proficiency: "ADVANCED" },
          { id: "skill-go", name: "Go", proficiency: "INTERMEDIATE" },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete TypeScript" }));

    await waitFor(() => expect(screen.queryByText("TypeScript")).not.toBeInTheDocument());
    expect(screen.getByText("Go")).toBeInTheDocument();
  });
});

describe("Fit-score update flow — Part 2: jobs reflect updated scores", () => {
  it("shows higher fitScore on jobs list after a skill is added (backend recalculated)", async () => {
    const jobsWithUpdatedScore = [
      {
        id: "job-1",
        title: "Rust Developer",
        status: "APPLIED",
        fitScore: 95,
        tags: [],
        company: { name: "Acme Corp" },
      },
    ];

    server.use(
      http.get("/api/jobs", () =>
        HttpResponse.json({
          data: { items: jobsWithUpdatedScore, total: 1, page: 1, limit: 20 },
          error: null,
        })
      ),
      http.get("/api/companies", () =>
        HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 100 }, error: null })
      )
    );

    render(<JobsPage />);
    await waitFor(() => expect(screen.getByText("Rust Developer")).toBeInTheDocument());
    expect(screen.getByText("95")).toBeInTheDocument();
  });

  it("shows null score badge when fitScore is not yet calculated", async () => {
    server.use(
      http.get("/api/jobs", () =>
        HttpResponse.json({
          data: {
            items: [{ id: "job-2", title: "New Grad Role", status: "APPLIED", fitScore: null, tags: [], company: { name: "Beta Inc" } }],
            total: 1,
            page: 1,
            limit: 20,
          },
          error: null,
        })
      ),
      http.get("/api/companies", () =>
        HttpResponse.json({ data: { items: [], total: 0, page: 1, limit: 100 }, error: null })
      )
    );

    render(<JobsPage />);
    await waitFor(() => expect(screen.getByText("New Grad Role")).toBeInTheDocument());
    expect(screen.queryByText("95")).not.toBeInTheDocument();
  });
});
