"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  size: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  cultureNotes: z.string().optional(),
});

export type CompanyFormInput = z.infer<typeof companyFormSchema>;

interface Props {
  initialValues?: Partial<CompanyFormInput>;
  onSubmit: (data: CompanyFormInput) => Promise<void>;
  submitLabel?: string;
}

export function CompanyForm({ initialValues, onSubmit, submitLabel = "Save" }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormInput>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      industry: initialValues?.industry ?? "",
      size: initialValues?.size ?? "",
      location: initialValues?.location ?? "",
      website: initialValues?.website ?? "",
      cultureNotes: initialValues?.cultureNotes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Company Name *</Label>
        <Input id="name" {...register("name")} error={errors.name?.message} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" {...register("industry")} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="size">Size</Label>
          <Input id="size" {...register("size")} placeholder="e.g. 50–200" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register("location")} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="website">Website</Label>
          <Input id="website" type="url" {...register("website")} placeholder="https://" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="cultureNotes">Culture Notes</Label>
        <Input id="cultureNotes" {...register("cultureNotes")} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
