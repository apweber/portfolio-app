import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileInfoForm } from "@/components/profile/ProfileInfoForm";
import { SkillsManager } from "@/components/profile/SkillsManager";
import { FitWeightsForm } from "@/components/profile/FitWeightsForm";

export default async function ProfilePage() {
  const profile = await requireAuth();
  const [skills, weights] = await Promise.all([
    prisma.skill.findMany({ where: { userId: profile.id }, orderBy: { createdAt: "asc" } }),
    prisma.fitWeights.findUnique({ where: { userId: profile.id } }),
  ]);

  const initialWeights = weights ?? {
    skillsWeight: 40,
    salaryWeight: 30,
    remoteWeight: 20,
    locationWeight: 10,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
      <ProfileInfoForm initialProfile={profile} />
      <hr className="border-gray-200" />
      <SkillsManager initialSkills={skills} />
      <hr className="border-gray-200" />
      <FitWeightsForm initialWeights={initialWeights} />
    </div>
  );
}
