import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateFitScore } from "@/lib/fit-score/calculate";
import { FitScoreBadge } from "@/components/jobs/FitScoreBadge";
import { FitScoreBreakdown } from "@/components/jobs/FitScoreBreakdown";
import { TagList } from "@/components/jobs/TagList";
import { JobDetailClient } from "./JobDetailClient";

type Params = { params: Promise<{ id: string }> };

export default async function JobDetailPage({ params }: Params) {
  const profile = await requireAuth();
  const { id } = await params;

  const [job, fullProfile] = await Promise.all([
    prisma.job.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        requiredSkills: { select: { skillName: true } },
        tags: { select: { tag: true } },
      },
    }),
    prisma.profile.findUnique({
      where: { id: profile.id },
      include: {
        skills: { select: { name: true, proficiency: true } },
        fitWeights: true,
      },
    }),
  ]);

  if (!job) notFound();
  if (job.userId !== profile.id && profile.role !== "ADMIN") notFound();

  const weights = fullProfile?.fitWeights ?? {
    skillsWeight: 40,
    salaryWeight: 30,
    remoteWeight: 20,
    locationWeight: 10,
  };

  const fitResult = calculateFitScore({
    userSkills: (fullProfile?.skills ?? []).map((s) => ({
      name: s.name,
      proficiency: s.proficiency as import("@/lib/fit-score/calculate").Proficiency,
    })),
    jobRequiredSkills: job.requiredSkills.map((s) => s.skillName),
    targetSalary: fullProfile?.targetSalary ?? null,
    jobSalaryMin: job.salaryRangeMin,
    jobSalaryMax: job.salaryRangeMax,
    userWorkPreference: (fullProfile?.workPreference ?? null) as import("@/lib/fit-score/calculate").WorkPref | null,
    jobWorkPreference: (job.workPreference ?? null) as import("@/lib/fit-score/calculate").WorkPref | null,
    userPreferredLocation: fullProfile?.preferredLocation ?? null,
    jobLocation: job.location ?? null,
    weights,
  });

  const tags = job.tags.map((t) => t.tag);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
          <Link href={`/companies/${job.company.id}`} className="text-sm text-blue-600 hover:underline">
            {job.company.name}
          </Link>
        </div>
        <Link href="/jobs" className="text-sm text-blue-600 hover:underline">
          ← Back
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <FitScoreBadge score={job.fitScore} />
        {job.postingUrl && (
          <a
            href={job.postingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View Posting ↗
          </a>
        )}
      </div>

      <FitScoreBreakdown breakdown={fitResult.breakdown} />

      {tags.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tags</p>
          <TagList tags={tags} />
        </div>
      )}

      {job.requiredSkills.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Required Skills</p>
          <TagList tags={job.requiredSkills.map((s) => s.skillName)} />
        </div>
      )}

      {job.description && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </div>
      )}

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {job.applicationDate && (
          <>
            <dt className="font-medium text-gray-700">Applied</dt>
            <dd className="text-gray-500">
              {new Date(job.applicationDate).toLocaleDateString()}
            </dd>
          </>
        )}
        {job.location && (
          <>
            <dt className="font-medium text-gray-700">Location</dt>
            <dd className="text-gray-500">{job.location}</dd>
          </>
        )}
        {job.workPreference && (
          <>
            <dt className="font-medium text-gray-700">Work Preference</dt>
            <dd className="text-gray-500">{job.workPreference}</dd>
          </>
        )}
        {(job.salaryRangeMin || job.salaryRangeMax) && (
          <>
            <dt className="font-medium text-gray-700">Salary Range</dt>
            <dd className="text-gray-500">
              {job.salaryRangeMin && `$${job.salaryRangeMin.toLocaleString()}`}
              {job.salaryRangeMin && job.salaryRangeMax && " – "}
              {job.salaryRangeMax && `$${job.salaryRangeMax.toLocaleString()}`}
            </dd>
          </>
        )}
      </dl>

      <JobDetailClient
        jobId={id}
        initialStatus={job.status}
        initialNotes={job.notes ?? ""}
      />
    </div>
  );
}
