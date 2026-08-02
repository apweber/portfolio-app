"use client";

const STATUSES = [
  { value: "APPLIED", label: "Applied" },
  { value: "PHONE_SCREEN", label: "Phone Screen" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
];

const WORK_PREFS = [
  { value: "", label: "Any preference" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ONSITE", label: "On-site" },
];

export interface FilterState {
  status?: string;
  companyId?: string;
  workPreference?: string;
  sort: string;
}

interface Props {
  filters: FilterState;
  companies: { id: string; name: string }[];
  onChange: (filters: FilterState) => void;
}

export function JobFilters({ filters, companies, onChange }: Props) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by status">
        {STATUSES.map(({ value, label }) => {
          const active = filters.status === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => set("status", active ? undefined : value)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                active
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {companies.length > 0 && (
        <select
          aria-label="Filter by company"
          value={filters.companyId ?? ""}
          onChange={(e) => set("companyId", e.target.value || undefined)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 bg-white"
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      <select
        aria-label="Work preference"
        value={filters.workPreference ?? ""}
        onChange={(e) => set("workPreference", e.target.value || undefined)}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 bg-white"
      >
        {WORK_PREFS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        aria-label="Sort by"
        value={filters.sort}
        onChange={(e) => set("sort", e.target.value)}
        className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 bg-white"
      >
        <option value="fitScore">Fit Score</option>
        <option value="applicationDate">Application Date</option>
        <option value="company">Company</option>
      </select>
    </div>
  );
}
