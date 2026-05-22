import Link from "next/link";
import { StatusBadge } from "@/components/jobs/StatusBadge";

const STATUSES = [
  { value: "APPLIED", label: "Applied" },
  { value: "PHONE_SCREEN", label: "Phone Screen" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
];

interface Props {
  counts: Record<string, number>;
}

export function ApplicationStatusSummary({ counts }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {STATUSES.map(({ value, label }) => (
        <Link
          key={value}
          href={`/jobs?status=${value}`}
          className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-300 transition-colors text-center"
          aria-label={`${label}: ${counts[value] ?? 0} jobs`}
        >
          <span className="text-2xl font-bold text-gray-900">{counts[value] ?? 0}</span>
          <StatusBadge status={value} />
        </Link>
      ))}
    </div>
  );
}
