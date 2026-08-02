"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const jobFormSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  postingUrl: z.string().optional(),
  location: z.string().optional(),
  salaryRangeMin: z.string().optional(),
  salaryRangeMax: z.string().optional(),
  workPreference: z.string().optional(),
  status: z.string(),
  applicationDate: z.string().optional(),
  notes: z.string().optional(),
  requiredSkills: z.array(z.string()),
  tags: z.array(z.string()),
});

export type JobFormInput = z.infer<typeof jobFormSchema>;

interface Company {
  id: string;
  name: string;
}

interface Props {
  initialValues?: Partial<JobFormInput>;
  companies: Company[];
  onSubmit: (data: JobFormInput) => Promise<void>;
  submitLabel?: string;
}

function ChipInput({
  id,
  label,
  chips,
  onAdd,
  onRemove,
}: {
  id: string;
  label: string;
  chips: string[];
  onAdd: (v: string) => void;
  onRemove: (i: number) => void;
}) {
  const [value, setValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onAdd(trimmed);
        setValue("");
      }
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
            >
              {chip}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="hover:text-blue-600"
                aria-label={`Remove ${chip}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter"
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export function JobForm({ initialValues, companies, onSubmit, submitLabel = "Save" }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<JobFormInput>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      companyId: initialValues?.companyId ?? "",
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      postingUrl: initialValues?.postingUrl ?? "",
      location: initialValues?.location ?? "",
      salaryRangeMin: initialValues?.salaryRangeMin ?? "",
      salaryRangeMax: initialValues?.salaryRangeMax ?? "",
      workPreference: initialValues?.workPreference ?? "",
      status: initialValues?.status ?? "APPLIED",
      applicationDate: initialValues?.applicationDate ?? "",
      notes: initialValues?.notes ?? "",
      requiredSkills: initialValues?.requiredSkills ?? [],
      tags: initialValues?.tags ?? [],
    },
  });

  const skills = watch("requiredSkills");
  const tags = watch("tags");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="companyId">Company *</Label>
        <select
          id="companyId"
          {...register("companyId")}
          className={`rounded-md border px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyId ? "border-red-400" : "border-gray-300"}`}
        >
          <option value="">Select a company…</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.companyId && (
          <span className="text-xs text-red-600">{errors.companyId.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register("title")} error={errors.title?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            {...register("status")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="APPLIED">Applied</option>
            <option value="PHONE_SCREEN">Phone Screen</option>
            <option value="INTERVIEWING">Interviewing</option>
            <option value="OFFER">Offer</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="workPreference">Work Preference</Label>
          <select
            id="workPreference"
            {...register("workPreference")}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">On-site</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="salaryRangeMin">Salary Min</Label>
          <Input
            id="salaryRangeMin"
            type="number"
            min="0"
            {...register("salaryRangeMin")}
            placeholder="e.g. 80000"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="salaryRangeMax">Salary Max</Label>
          <Input
            id="salaryRangeMax"
            type="number"
            min="0"
            {...register("salaryRangeMax")}
            placeholder="e.g. 120000"
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register("location")} />
        </div>

        <div className="flex flex-col gap-1">
          <Label htmlFor="applicationDate">Application Date</Label>
          <Input id="applicationDate" type="date" {...register("applicationDate")} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="postingUrl">Posting URL</Label>
        <Input id="postingUrl" type="url" {...register("postingUrl")} placeholder="https://" />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register("description")}
          rows={3}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <ChipInput
        id="required-skills"
        label="Required Skills"
        chips={skills}
        onAdd={(v) => setValue("requiredSkills", [...skills, v])}
        onRemove={(i) => setValue("requiredSkills", skills.filter((_, j) => j !== i))}
      />

      <ChipInput
        id="tags"
        label="Tags"
        chips={tags}
        onAdd={(v) => setValue("tags", [...tags, v])}
        onRemove={(i) => setValue("tags", tags.filter((_, j) => j !== i))}
      />

      <div className="flex flex-col gap-1">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          {...register("notes")}
          rows={4}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Interview notes, contacts, follow-ups…"
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
