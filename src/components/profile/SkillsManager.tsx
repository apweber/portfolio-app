"use client";
import { useState } from "react";
import { post, patch, del } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { ApiClientError } from "@/lib/api";

interface Skill {
  id: string;
  name: string;
  proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
}

interface Props {
  initialSkills: Skill[];
}

const PROFICIENCY_OPTIONS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

export function SkillsManager({ initialSkills }: Props) {
  const { show } = useToast();
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [newName, setNewName] = useState("");
  const [newProficiency, setNewProficiency] = useState<Skill["proficiency"]>("INTERMEDIATE");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const created = await post<Skill>("/api/skills", {
        name: newName.trim(),
        proficiency: newProficiency,
      });
      setSkills((prev) => [...prev, created]);
      setNewName("");
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "DUPLICATE") {
        show({ variant: "error", message: `Skill "${newName}" already exists.` });
      } else {
        show({ variant: "error", message: "Failed to add skill." });
      }
    } finally {
      setAdding(false);
    }
  };

  const handleProficiencyChange = async (skill: Skill, proficiency: Skill["proficiency"]) => {
    try {
      await patch(`/api/skills/${skill.id}`, { proficiency });
      setSkills((prev) => prev.map((s) => (s.id === skill.id ? { ...s, proficiency } : s)));
    } catch {
      show({ variant: "error", message: "Failed to update skill." });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await del(`/api/skills/${id}`);
      setSkills((prev) => prev.filter((s) => s.id !== id));
    } catch {
      show({ variant: "error", message: "Failed to delete skill." });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">Skills</h3>
      <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
        {skills.map((skill) => (
          <li key={skill.id} className="flex items-center justify-between px-4 py-2">
            <span className="text-sm font-medium text-gray-900">{skill.name}</span>
            <div className="flex items-center gap-2">
              <select
                aria-label={`Proficiency for ${skill.name}`}
                value={skill.proficiency}
                onChange={(e) => handleProficiencyChange(skill, e.target.value as Skill["proficiency"])}
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              >
                {PROFICIENCY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p[0] + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(skill.id)}
                aria-label={`Delete ${skill.name}`}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
        {skills.length === 0 && (
          <li className="px-4 py-3 text-sm text-gray-500">No skills yet.</li>
        )}
      </ul>
      <div className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="new-skill-name">Add skill</Label>
          <Input
            id="new-skill-name"
            placeholder="e.g. TypeScript"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="new-skill-proficiency">Level</Label>
          <Select
            id="new-skill-proficiency"
            value={newProficiency}
            onChange={(e) => setNewProficiency(e.target.value as Skill["proficiency"])}
          >
            {PROFICIENCY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p[0] + p.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={handleAdd} disabled={adding || !newName.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
