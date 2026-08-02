"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const registerSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Create account</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              {...register("email")}
            />
            {errors.email && (
              <p role="alert" className="text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              {...register("password")}
            />
            {errors.password && (
              <p role="alert" className="text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {formError && (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
