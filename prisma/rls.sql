-- Row-Level Security policies for the job tracker app.
-- Run this once after migrations: psql $DIRECT_URL -f prisma/rls.sql
-- (or paste into Supabase SQL editor)

-- Helper: returns true if the current Supabase auth user has role=ADMIN in Profile
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM "Profile"
    WHERE id = auth.uid()::text AND role = 'ADMIN'
  );
$$;

-- ─── Profile ───────────────────────────────────────────────────────────────────
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_select_own" ON "Profile"
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "profile_select_admin" ON "Profile"
  FOR SELECT USING (is_admin());

CREATE POLICY "profile_update_own" ON "Profile"
  FOR UPDATE USING (auth.uid()::text = id);

-- ─── Skill ─────────────────────────────────────────────────────────────────────
ALTER TABLE "Skill" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skill_all_own" ON "Skill"
  USING (auth.uid()::text = "userId");

CREATE POLICY "skill_select_admin" ON "Skill"
  FOR SELECT USING (is_admin());

-- ─── FitWeights ────────────────────────────────────────────────────────────────
ALTER TABLE "FitWeights" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fitweights_all_own" ON "FitWeights"
  USING (auth.uid()::text = "userId");

CREATE POLICY "fitweights_select_admin" ON "FitWeights"
  FOR SELECT USING (is_admin());

-- ─── Company ───────────────────────────────────────────────────────────────────
-- Companies are shared: any authenticated user may read them.
-- Only the creator may update or delete.
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_select_authenticated" ON "Company"
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "company_insert_authenticated" ON "Company"
  FOR INSERT WITH CHECK (auth.uid()::text = "createdById");

CREATE POLICY "company_update_creator" ON "Company"
  FOR UPDATE USING (auth.uid()::text = "createdById");

CREATE POLICY "company_delete_creator" ON "Company"
  FOR DELETE USING (auth.uid()::text = "createdById" OR is_admin());

-- ─── Job ───────────────────────────────────────────────────────────────────────
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_all_own" ON "Job"
  USING (auth.uid()::text = "userId");

CREATE POLICY "job_select_admin" ON "Job"
  FOR SELECT USING (is_admin());

CREATE POLICY "job_delete_admin" ON "Job"
  FOR DELETE USING (is_admin());

-- ─── JobSkill ──────────────────────────────────────────────────────────────────
ALTER TABLE "JobSkill" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobskill_all_own" ON "JobSkill"
  USING (
    EXISTS (
      SELECT 1 FROM "Job"
      WHERE "Job".id = "JobSkill"."jobId"
        AND "Job"."userId" = auth.uid()::text
    )
  );

-- ─── JobTag ────────────────────────────────────────────────────────────────────
ALTER TABLE "JobTag" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobtag_all_own" ON "JobTag"
  USING (
    EXISTS (
      SELECT 1 FROM "Job"
      WHERE "Job".id = "JobTag"."jobId"
        AND "Job"."userId" = auth.uid()::text
    )
  );
