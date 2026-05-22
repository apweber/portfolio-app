"use client";
import { useState, useEffect } from "react";
import { get, del } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";
import { StatusBadge } from "@/components/jobs/StatusBadge";
import { FitScoreBadge } from "@/components/jobs/FitScoreBadge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

interface AdminJob {
  id: string;
  title: string;
  status: string;
  fitScore: number | null;
  company: { name: string };
  profile: { email: string };
}

export default function AdminJobsPage() {
  const { show } = useToast();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<{ items: AdminJob[] }>("/api/admin/jobs")
      .then((r) => setJobs(r.items))
      .catch(() => show({ variant: "error", message: "Failed to load jobs." }))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (jobId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await del(`/api/admin/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      show({ variant: "success", message: "Job deleted." });
    } catch {
      show({ variant: "error", message: "Failed to delete job." });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">All Jobs</h2>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-gray-500">No jobs found.</p>
      ) : (
        <div className="rounded-md border border-gray-200 overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200 text-left">
                <th className="px-4 py-2 font-medium text-gray-700">Title</th>
                <th className="px-4 py-2 font-medium text-gray-700">Company</th>
                <th className="px-4 py-2 font-medium text-gray-700">Owner</th>
                <th className="px-4 py-2 font-medium text-gray-700">Status</th>
                <th className="px-4 py-2 font-medium text-gray-700">Score</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{job.title}</td>
                  <td className="px-4 py-2 text-gray-500">{job.company.name}</td>
                  <td className="px-4 py-2 text-gray-500">{job.profile.email}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-2">
                    <FitScoreBadge score={job.fitScore} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(job.id, job.title)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
