"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { get } from "@/lib/api";
import { ApplicationStatusSummary } from "@/components/dashboard/ApplicationStatusSummary";
import { RecentJobsList } from "@/components/dashboard/RecentJobsList";
import { Skeleton } from "@/components/ui/Skeleton";

interface Job {
  id: string;
  title: string;
  status: string;
  fitScore: number | null;
  updatedAt: string;
  company: { name: string };
}

const ALL_STATUSES = ["APPLIED", "PHONE_SCREEN", "INTERVIEWING", "OFFER", "REJECTED"];

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<{ items: Job[] }>("/api/jobs?limit=100&sort=applicationDate")
      .then((r) => setJobs(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = jobs.filter((j) => j.status === s).length;
    return acc;
  }, {});

  const recentJobs = [...jobs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">Your job search at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/companies/new"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            New Company
          </Link>
          <Link
            href="/jobs/new"
            className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Job
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <ApplicationStatusSummary counts={counts} />
      )}

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <RecentJobsList jobs={recentJobs} />
        )}
      </div>
    </div>
  );
}
