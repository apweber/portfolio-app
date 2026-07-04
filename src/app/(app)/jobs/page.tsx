"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { get } from "@/lib/api";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters, type FilterState } from "@/components/jobs/JobFilters";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface Job {
  id: string;
  title: string;
  status: string;
  fitScore: number | null;
  tags: string[];
  company: { name: string };
}

interface ListResult {
  items: Job[];
  total: number;
  page: number;
  limit: number;
}

interface Company {
  id: string;
  name: string;
}

const LIMIT = 20;

export default function JobsPage() {
  const [filters, setFilters] = useState<FilterState>({ sort: "fitScore" });
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [result, setResult] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<{ items: Company[] }>("/api/companies?limit=100")
      .then((r) => setCompanies(r.items))
      .catch(() => {});
  }, []);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort: filters.sort, page: String(page), limit: String(LIMIT) });
    if (filters.status) params.set("status", filters.status);
    if (filters.companyId) params.set("companyId", filters.companyId);
    if (filters.workPreference) params.set("workPreference", filters.workPreference);
    get<ListResult>(`/api/jobs?${params}`)
      .then(setResult)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => {
    // Intentional fetch-on-mount / on-dependency-change; the setLoading inside
    // fetchJobs is the sanctioned way to reflect request state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobs();
  }, [fetchJobs]);

  const handleFilterChange = (next: FilterState) => {
    setFilters(next);
    setPage(1);
  };

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Jobs</h2>
        <Link
          href="/jobs/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Job
        </Link>
      </div>

      <JobFilters filters={filters} companies={companies} onChange={handleFilterChange} />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : result && result.items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No jobs found"
          description={
            filters.status
              ? `No ${filters.status.toLowerCase()} jobs.`
              : "Add your first job to get started."
          }
          action={
            <Link href="/jobs/new" className="text-sm text-blue-600 hover:underline">
              Add Job
            </Link>
          }
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
