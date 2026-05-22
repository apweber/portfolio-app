import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import { FitScoreBadge } from "./FitScoreBadge";
import { TagList } from "./TagList";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    status: string;
    fitScore: number | null;
    tags: string[];
    company: { name: string };
  };
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-300 transition-colors space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{job.title}</p>
          <p className="text-xs text-gray-500 truncate">{job.company.name}</p>
        </div>
        <FitScoreBadge score={job.fitScore} />
      </div>
      <StatusBadge status={job.status} />
      {job.tags.length > 0 && <TagList tags={job.tags} />}
    </Link>
  );
}
