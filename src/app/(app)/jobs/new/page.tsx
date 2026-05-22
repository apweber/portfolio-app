"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { get, post } from "@/lib/api";
import { JobForm, type JobFormInput } from "@/components/jobs/JobForm";
import { useToast } from "@/components/providers/ToastProvider";

interface Company {
  id: string;
  name: string;
}

export default function NewJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { show } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    get<{ items: Company[] }>("/api/companies?limit=100")
      .then((r) => setCompanies(r.items))
      .catch(() => {});
  }, []);

  const handleSubmit = async (data: JobFormInput) => {
    try {
      const payload = {
        companyId: data.companyId,
        title: data.title,
        description: data.description || undefined,
        postingUrl: data.postingUrl || undefined,
        location: data.location || undefined,
        salaryRangeMin: data.salaryRangeMin ? parseInt(data.salaryRangeMin, 10) : null,
        salaryRangeMax: data.salaryRangeMax ? parseInt(data.salaryRangeMax, 10) : null,
        workPreference: (data.workPreference as "REMOTE" | "HYBRID" | "ONSITE" | undefined) || null,
        status: data.status as "APPLIED" | "PHONE_SCREEN" | "INTERVIEWING" | "OFFER" | "REJECTED",
        applicationDate: data.applicationDate ? new Date(data.applicationDate).toISOString() : null,
        notes: data.notes || undefined,
        requiredSkills: data.requiredSkills,
        tags: data.tags,
      };
      const job = await post<{ id: string }>("/api/jobs", payload);
      show({ variant: "success", message: "Job added." });
      router.push(`/jobs/${job.id}`);
    } catch {
      show({ variant: "error", message: "Failed to add job." });
    }
  };

  const prefillCompanyId = searchParams.get("companyId") ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Add Job</h2>
      <JobForm
        companies={companies}
        initialValues={{ companyId: prefillCompanyId }}
        onSubmit={handleSubmit}
        submitLabel="Add Job"
      />
    </div>
  );
}
