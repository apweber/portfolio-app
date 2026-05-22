"use client";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { CompanyForm, type CompanyFormInput } from "@/components/companies/CompanyForm";

export default function NewCompanyPage() {
  const router = useRouter();
  const { show } = useToast();

  const handleSubmit = async (data: CompanyFormInput) => {
    try {
      const payload = {
        ...data,
        website: data.website || undefined,
      };
      const company = await post<{ id: string }>("/api/companies", payload);
      show({ variant: "success", message: "Company created." });
      router.push(`/companies/${company.id}`);
    } catch {
      show({ variant: "error", message: "Failed to create company." });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Add Company</h2>
      <CompanyForm onSubmit={handleSubmit} submitLabel="Create Company" />
    </div>
  );
}
