"use client";
import { Input } from "@/components/ui/Input";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function CompanySearch({ value, onChange }: Props) {
  return (
    <Input
      placeholder="Search companies…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Search companies"
    />
  );
}
