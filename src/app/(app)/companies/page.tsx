"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { get } from "@/lib/api";
import { CompanySearch } from "@/components/companies/CompanySearch";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface Company {
  id: string;
  name: string;
  industry?: string | null;
  location?: string | null;
  size?: string | null;
}

interface ListResult {
  items: Company[];
  total: number;
  page: number;
  limit: number;
}

const LIMIT = 20;

export default function CompaniesPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const fetchCompanies = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (debouncedQ) params.set("q", debouncedQ);
    get<ListResult>(`/api/companies?${params}`)
      .then(setResult)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQ, page]);

  useEffect(() => {
    // Intentional fetch-on-mount / on-dependency-change; the setLoading inside
    // fetchCompanies is the sanctioned way to reflect request state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCompanies();
  }, [fetchCompanies]);

  const totalPages = result ? Math.ceil(result.total / LIMIT) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Companies</h2>
        <Link
          href="/companies/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Company
        </Link>
      </div>
      <CompanySearch value={q} onChange={setQ} />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : result && result.items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No companies found"
          description={debouncedQ ? `No results for "${debouncedQ}"` : "Add your first company to get started."}
          action={<Link href="/companies/new" className="text-sm text-blue-600 hover:underline">Add Company</Link>}
        />
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
