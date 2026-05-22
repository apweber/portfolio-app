import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/api", () => ({
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  ApiClientError: class ApiClientError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
      this.name = "ApiClientError";
    }
  },
}));

vi.mock("@/components/providers/ToastProvider", () => ({
  useToast: () => ({ show: vi.fn() }),
}));

import { post, del } from "@/lib/api";
import { SkillsManager } from "./SkillsManager";

const mockSkill = { id: "skill-1", name: "TypeScript", proficiency: "ADVANCED" as const };

describe("SkillsManager", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders existing skills", () => {
    render(<SkillsManager initialSkills={[mockSkill]} />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("calls POST /api/skills when a skill is added", async () => {
    vi.mocked(post).mockResolvedValue({ id: "skill-2", name: "React", proficiency: "INTERMEDIATE" } as any);
    render(<SkillsManager initialSkills={[]} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. TypeScript"), { target: { value: "React" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/api/skills", { name: "React", proficiency: "INTERMEDIATE" })
    );
  });

  it("adds the new skill to the list after successful POST", async () => {
    vi.mocked(post).mockResolvedValue({ id: "skill-2", name: "React", proficiency: "INTERMEDIATE" } as any);
    render(<SkillsManager initialSkills={[]} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. TypeScript"), { target: { value: "React" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(screen.getByText("React")).toBeInTheDocument());
  });

  it("calls DELETE when a skill is removed", async () => {
    vi.mocked(del).mockResolvedValue({} as any);
    render(<SkillsManager initialSkills={[mockSkill]} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete TypeScript" }));

    await waitFor(() => expect(del).toHaveBeenCalledWith("/api/skills/skill-1"));
  });

  it("removes the skill from the list after successful DELETE", async () => {
    vi.mocked(del).mockResolvedValue({} as any);
    render(<SkillsManager initialSkills={[mockSkill]} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete TypeScript" }));

    await waitFor(() => expect(screen.queryByText("TypeScript")).not.toBeInTheDocument());
  });
});
