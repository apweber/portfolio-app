"use client";
import { useState } from "react";
import { patch } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { CompanyForm, type CompanyFormInput } from "@/components/companies/CompanyForm";
import { Button } from "@/components/ui/Button";

interface Props {
  companyId: string;
  initialValues: Partial<CompanyFormInput> & { name: string };
}

export function CompanyDetailClient({ companyId, initialValues }: Props) {
  const { show } = useToast();
  const [editing, setEditing] = useState(false);

  const handleSubmit = async (data: CompanyFormInput) => {
    try {
      const payload = { ...data, website: data.website || undefined };
      await patch(`/api/companies/${companyId}`, payload);
      show({ variant: "success", message: "Company updated." });
      setEditing(false);
    } catch {
      show({ variant: "error", message: "Failed to update company." });
    }
  };

  if (!editing) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
        Edit
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-blue-900">Edit Company</h3>
      <CompanyForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="Update Company"
      />
      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </div>
  );
}
