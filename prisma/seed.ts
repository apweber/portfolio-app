/**
 * Seed script: creates two users and sample data for local development.
 *
 * NOTE: Profile.id must match a Supabase auth UID. Before running this seed,
 * create the corresponding Supabase auth accounts (via Supabase dashboard or
 * admin API) and update ALICE_ID / ADMIN_ID below with the returned UUIDs.
 *
 * Run: pnpm db:seed
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Replace with real Supabase auth UIDs after creating the users.
const ALICE_ID = process.env.SEED_ALICE_ID ?? "00000000-0000-0000-0000-000000000001";
const ADMIN_ID = process.env.SEED_ADMIN_ID ?? "00000000-0000-0000-0000-000000000002";

async function main() {
  // ── Profiles ────────────────────────────────────────────────────────────────
  const alice = await prisma.profile.upsert({
    where: { id: ALICE_ID },
    update: {},
    create: {
      id: ALICE_ID,
      email: "alice@example.com",
      name: "Alice",
      role: "USER",
      targetSalary: 140000,
      workPreference: "REMOTE",
      preferredLocation: "San Francisco",
    },
  });

  await prisma.profile.upsert({
    where: { id: ADMIN_ID },
    update: {},
    create: {
      id: ADMIN_ID,
      email: "admin@example.com",
      name: "Admin",
      role: "ADMIN",
    },
  });

  // ── Skills ──────────────────────────────────────────────────────────────────
  for (const [name, proficiency] of [
    ["TypeScript", "EXPERT"],
    ["React", "ADVANCED"],
    ["Node.js", "ADVANCED"],
    ["PostgreSQL", "INTERMEDIATE"],
  ] as const) {
    await prisma.skill.upsert({
      where: { userId_name: { userId: alice.id, name } },
      update: {},
      create: { userId: alice.id, name, proficiency },
    });
  }

  // ── FitWeights ──────────────────────────────────────────────────────────────
  await prisma.fitWeights.upsert({
    where: { userId: alice.id },
    update: {},
    create: {
      userId: alice.id,
      skillsWeight: 40,
      salaryWeight: 30,
      remoteWeight: 20,
      locationWeight: 10,
    },
  });

  // ── Companies ───────────────────────────────────────────────────────────────
  const acme = await prisma.company.upsert({
    where: { id: "seed-company-acme" },
    update: {},
    create: {
      id: "seed-company-acme",
      name: "Acme Corp",
      industry: "Technology",
      size: "201-500",
      location: "San Francisco, CA",
      website: "https://acme.example.com",
      createdById: alice.id,
    },
  });

  const globex = await prisma.company.upsert({
    where: { id: "seed-company-globex" },
    update: {},
    create: {
      id: "seed-company-globex",
      name: "Globex",
      industry: "Software",
      size: "51-200",
      location: "Remote",
      createdById: alice.id,
    },
  });

  // ── Jobs ────────────────────────────────────────────────────────────────────
  await prisma.job.upsert({
    where: { id: "seed-job-1" },
    update: {},
    create: {
      id: "seed-job-1",
      userId: alice.id,
      companyId: acme.id,
      title: "Senior Software Engineer",
      status: "APPLIED",
      salaryRangeMin: 130000,
      salaryRangeMax: 160000,
      workPreference: "REMOTE",
      location: "San Francisco, CA",
      requiredSkills: {
        create: [{ skillName: "TypeScript" }, { skillName: "React" }],
      },
      tags: { create: [{ tag: "remote" }, { tag: "fintech" }] },
    },
  });

  await prisma.job.upsert({
    where: { id: "seed-job-2" },
    update: {},
    create: {
      id: "seed-job-2",
      userId: alice.id,
      companyId: globex.id,
      title: "Full Stack Engineer",
      status: "PHONE_SCREEN",
      salaryRangeMin: 120000,
      salaryRangeMax: 150000,
      workPreference: "HYBRID",
      requiredSkills: {
        create: [{ skillName: "TypeScript" }, { skillName: "Node.js" }],
      },
      tags: { create: [{ tag: "startup" }] },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
