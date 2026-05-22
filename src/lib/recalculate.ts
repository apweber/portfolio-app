import { prisma } from "@/lib/prisma";
import { scoreViaService } from "@/lib/fit-score/client";
import { type FitInput, type Proficiency, type WorkPref } from "@/lib/fit-score/calculate";
import type { Profile, Skill, FitWeights, Job, JobSkill } from "@/generated/prisma/client";

type ProfileWithSkills = Profile & { skills: Skill[] };
type JobWithSkills = Job & { requiredSkills: JobSkill[] };

function buildFitInput(
  job: JobWithSkills,
  profile: ProfileWithSkills,
  weights: FitWeights
): FitInput {
  return {
    userSkills: profile.skills.map((s) => ({
      name: s.name,
      proficiency: s.proficiency as Proficiency,
    })),
    jobRequiredSkills: job.requiredSkills.map((s) => s.skillName),
    targetSalary: profile.targetSalary,
    jobSalaryMin: job.salaryRangeMin,
    jobSalaryMax: job.salaryRangeMax,
    userWorkPreference: profile.workPreference as WorkPref | null,
    jobWorkPreference: job.workPreference as WorkPref | null,
    userPreferredLocation: profile.preferredLocation,
    jobLocation: job.location,
    weights: {
      skillsWeight: weights.skillsWeight,
      salaryWeight: weights.salaryWeight,
      remoteWeight: weights.remoteWeight,
      locationWeight: weights.locationWeight,
    },
  };
}

export async function computeJobFitScore(
  job: JobWithSkills,
  profile: ProfileWithSkills,
  weights: FitWeights
): Promise<number | null> {
  const input = buildFitInput(job, profile, weights);
  try {
    const result = await scoreViaService(input);
    return result.score;
  } catch {
    return null;
  }
}

export async function recalculateUserJobs(userId: string): Promise<void> {
  const [profile, weights, jobs] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: userId },
      include: { skills: true },
    }),
    prisma.fitWeights.findUnique({ where: { userId } }),
    prisma.job.findMany({
      where: {
        userId,
        status: { notIn: ["OFFER", "REJECTED"] },
      },
      include: { requiredSkills: true },
    }),
  ]);

  if (!profile || !weights) return;

  await Promise.all(
    jobs.map(async (job) => {
      try {
        const score = await computeJobFitScore(job, profile, weights);
        await prisma.job.update({
          where: { id: job.id },
          data: { fitScore: score },
        });
      } catch (e) {
        console.error(`Failed to recalculate fit score for job ${job.id}:`, e);
      }
    })
  );
}
