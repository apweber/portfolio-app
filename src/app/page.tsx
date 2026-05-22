import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <main className="text-center space-y-6">
        <h1 className="text-4xl font-semibold text-zinc-900">Job Search Tracker</h1>
        <p className="text-zinc-600">Track your applications and find your best-fit roles.</p>
        <div className="flex justify-center gap-4">
          {profile ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
