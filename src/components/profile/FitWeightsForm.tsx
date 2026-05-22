"use client";
import { useState } from "react";
import { put } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

interface Weights {
  skillsWeight: number;
  salaryWeight: number;
  remoteWeight: number;
  locationWeight: number;
}

interface Props {
  initialWeights: Weights;
}

const WEIGHT_KEYS: { key: keyof Weights; label: string }[] = [
  { key: "skillsWeight", label: "Skills Match" },
  { key: "salaryWeight", label: "Salary" },
  { key: "remoteWeight", label: "Remote / Work Style" },
  { key: "locationWeight", label: "Location" },
];

export function FitWeightsForm({ initialWeights }: Props) {
  const { show } = useToast();
  const [weights, setWeights] = useState<Weights>(initialWeights);
  const [saving, setSaving] = useState(false);

  const total = Object.values(weights).reduce((s, v) => s + v, 0);
  const valid = total === 100;

  const handleChange = (key: keyof Weights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await put("/api/fit-weights", weights);
      show({ variant: "success", message: "Scores will refresh shortly." });
    } catch {
      show({ variant: "error", message: "Failed to save weights." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">Fit Score Weights</h3>
      <p className={`text-sm font-medium ${valid ? "text-green-700" : "text-red-600"}`}>
        Total: {total}/100
      </p>
      <div className="space-y-3">
        {WEIGHT_KEYS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <Label htmlFor={key}>
              {label}: {weights[key]}
            </Label>
            <input
              id={key}
              type="range"
              min={0}
              max={100}
              value={weights[key]}
              onChange={(e) => handleChange(key, Number(e.target.value))}
              className="w-full"
            />
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={!valid || saving}>
        {saving ? "Saving…" : "Save Weights"}
      </Button>
    </div>
  );
}
