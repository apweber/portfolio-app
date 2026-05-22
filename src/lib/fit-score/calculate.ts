export type Proficiency = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type WorkPref = "REMOTE" | "HYBRID" | "ONSITE";

export type FitInput = {
  userSkills: Array<{ name: string; proficiency: Proficiency }>;
  jobRequiredSkills: string[];
  targetSalary: number | null;
  jobSalaryMin: number | null;
  jobSalaryMax: number | null;
  userWorkPreference: WorkPref | null;
  jobWorkPreference: WorkPref | null;
  userPreferredLocation: string | null;
  jobLocation: string | null;
  weights: {
    skillsWeight: number;
    salaryWeight: number;
    remoteWeight: number;
    locationWeight: number;
  };
};

export type FitResult = {
  score: number;
  breakdown: {
    skillsScore: number;
    salaryScore: number;
    remoteScore: number;
    locationScore: number;
  };
};

const PROFICIENCY_WEIGHT: Record<Proficiency, number> = {
  EXPERT: 1.0,
  ADVANCED: 0.9,
  INTERMEDIATE: 0.75,
  BEGINNER: 0.5,
};

export function skillsScore(
  userSkills: Array<{ name: string; proficiency: Proficiency }>,
  required: string[]
): number {
  if (required.length === 0) return 100;

  const userMap = new Map(
    userSkills.map((s) => [s.name.toLowerCase(), s.proficiency])
  );

  let total = 0;
  for (const req of required) {
    const proficiency = userMap.get(req.toLowerCase());
    if (proficiency) total += PROFICIENCY_WEIGHT[proficiency];
  }

  return Math.round((total / required.length) * 100);
}

export function salaryScore(
  target: number | null,
  min: number | null,
  max: number | null
): number {
  if (target === null || min === null || max === null) return 100;
  if (target < min) return 0;
  if (target <= max) return 100;

  const excess = (target - max) / max;
  if (excess >= 0.2) return 0;
  return Math.round((1 - excess / 0.2) * 100);
}

export function remoteScore(
  user: WorkPref | null,
  job: WorkPref | null
): number {
  if (user === null || job === null) return 100;
  if (user === job) return 100;
  if (user === "REMOTE" && job === "HYBRID") return 60;
  if (user === "HYBRID" && job === "REMOTE") return 80;
  if (user === "ONSITE" && job === "REMOTE") return 50;
  return 30;
}

export function locationScore(
  user: string | null,
  job: string | null
): number {
  if (user === null || job === null) return 100;

  const userLower = user.toLowerCase();
  const jobLower = job.toLowerCase();

  if (userLower === jobLower) return 100;
  if (
    jobLower.includes("remote") ||
    jobLower.includes(userLower) ||
    userLower.includes(jobLower)
  )
    return 80;
  return 20;
}

export function calculateFitScore(input: FitInput): FitResult {
  const { weights } = input;
  const weightSum =
    weights.skillsWeight +
    weights.salaryWeight +
    weights.remoteWeight +
    weights.locationWeight;

  if (weightSum !== 100) {
    throw new Error(`Weights must sum to 100, got ${weightSum}`);
  }

  const sk = skillsScore(input.userSkills, input.jobRequiredSkills);
  const sal = salaryScore(input.targetSalary, input.jobSalaryMin, input.jobSalaryMax);
  const rem = remoteScore(input.userWorkPreference, input.jobWorkPreference);
  const loc = locationScore(input.userPreferredLocation, input.jobLocation);

  const score = Math.round(
    (sk * weights.skillsWeight +
      sal * weights.salaryWeight +
      rem * weights.remoteWeight +
      loc * weights.locationWeight) /
      100
  );

  return {
    score,
    breakdown: {
      skillsScore: sk,
      salaryScore: sal,
      remoteScore: rem,
      locationScore: loc,
    },
  };
}
