"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  async function onMagicLink() {
    const email = getValues("email");
    if (!email) return;
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (!error) setMagicLinkSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>

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
              autoComplete="current-password"
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
            Sign in
          </button>
        </form>

        <button
          type="button"
          onClick={onMagicLink}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Send magic link
        </button>

        {magicLinkSent && (
          <p className="text-sm text-green-600">Magic link sent! Check your email.</p>
        )}

        <p className="text-center text-sm text-zinc-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-zinc-900 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
