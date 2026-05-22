import Link from "next/link";
import { StatusBadge } from "@/components/jobs/StatusBadge";
import { FitScoreBadge } from "@/components/jobs/FitScoreBadge";

interface Job {
  id: string;
  title: string;
  status: string;
  fitScore: number | null;
  company: { name: string };
}

interface Props {
  jobs: Job[];
}

export function RecentJobsList({ jobs }: Props) {
  if (!jobs.length) {
    return <p className="text-sm text-gray-500">No jobs yet. Add your first job to get started.</p>;
  }
  return (
    <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
      {jobs.map((job) => (
        <li key={job.id}>
          <Link
            href={`/jobs/${job.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
              <p className="text-xs text-gray-500 truncate">{job.company.name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <StatusBadge status={job.status} />
              <FitScoreBadge score={job.fitScore} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
