"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { patch } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetSalary: z.number().int().min(0).nullable().optional(),
  workPreference: z.string().optional(),
  preferredLocation: z.string().optional(),
});

type ProfileFormInput = z.infer<typeof profileFormSchema>;

interface Props {
  initialProfile: {
    name: string;
    targetSalary: number | null;
    workPreference: "REMOTE" | "HYBRID" | "ONSITE" | null;
    preferredLocation: string | null;
  };
}

export function ProfileInfoForm({ initialProfile }: Props) {
  const { show } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initialProfile.name,
      targetSalary: initialProfile.targetSalary ?? undefined,
      workPreference: initialProfile.workPreference ?? undefined,
      preferredLocation: initialProfile.preferredLocation ?? "",
    },
  });

  const onSubmit = async (data: ProfileFormInput) => {
    const payload = {
      ...data,
      workPreference: (data.workPreference || null) as "REMOTE" | "HYBRID" | "ONSITE" | null,
      preferredLocation: data.preferredLocation || null,
    };
    try {
      await patch("/api/profile", payload);
      show({ variant: "success", message: "Profile updated." });
    } catch {
      show({ variant: "error", message: "Failed to update profile." });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">Profile Info</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} error={errors.name?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="targetSalary">Target Salary</Label>
          <Input
            id="targetSalary"
            type="number"
            {...register("targetSalary", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
            error={errors.targetSalary?.message}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="workPreference">Work Preference</Label>
          <Select id="workPreference" {...register("workPreference")}>
            <option value="">Any</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
            <option value="ONSITE">Onsite</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="preferredLocation">Preferred Location</Label>
          <Input id="preferredLocation" {...register("preferredLocation")} />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
