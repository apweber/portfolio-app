# Copilot Instructions

## Build, test, and lint commands

Use the root `pnpm` commands for the Next.js app:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:run
pnpm vitest run src/lib/fit-score/calculate.test.ts
pnpm prisma migrate deploy
pnpm db:seed
pnpm db:rls
```

If you change the standalone fit-score service, it has its own package and TypeScript config:

```bash
cd services/fit-score
npm run dev
npm run build
```

## High-level architecture

This repository is a multi-user job search tracker built with Next.js App Router, Supabase Auth, Prisma/Postgres, and a separate fit-score service.

- `src/app/(auth)` contains public login and registration pages.
- `src/app/(app)` is the protected application shell. Its server layout calls `getCurrentProfile()` and redirects unauthenticated users to `/login`.
- `src/app/(app)/admin` adds an admin-only layout guard that redirects non-admins to `/dashboard`.
- `src/app/api/**/route.ts` contains REST endpoints for jobs, companies, skills, profile, fit weights, and admin-only resources.

Authentication and authorization are split across layouts and API helpers:

- Supabase provides the session.
- `getCurrentProfile()` in `src/lib/auth.ts` reads the Supabase user and upserts a Prisma `Profile` row whose `id` matches the Supabase UID.
- UI route protection happens in server layouts; API protection happens per-handler with `requireAuth()` or `requireAdmin()`.

The data model in `prisma/schema.prisma` centers on `Profile`, `Skill`, `FitWeights`, `Company`, and `Job`. Jobs belong to a user and company, and related job skills/tags are stored in `JobSkill` and `JobTag`. Row-level security SQL lives separately in `prisma/rls.sql` and is applied after migrations.

Fit-score calculation spans the app and a standalone service:

- App code builds scoring input in `src/lib/recalculate.ts` and calls `scoreViaService()` from `src/lib/fit-score/client.ts`.
- Local development can proxy scoring through `src/app/api/fit-score/calculate/route.ts` by pointing `FIT_SCORE_SERVICE_URL` at that route.
- The standalone Cloud Run-oriented service lives in `services/fit-score/`.
- The root TypeScript config and Vitest config exclude `services/`, so service changes are not covered by the main app build/test setup.

## Key conventions

- API routes return a uniform envelope: `{ data: T, error: null }` on success and `{ data: null, error: { code, message, details? } }` on failure. Prefer `ok(...)` and `handleApiError(...)` from `src/lib/api-response.ts`.
- Client-side API calls should go through `get`, `post`, `patch`, `put`, and `del` in `src/lib/api.ts`; those helpers throw `ApiClientError` for error envelopes.
- Do not instantiate `PrismaClient` directly. Reuse `src/lib/prisma.ts`, which wires Prisma through the required `PrismaPg` adapter and `DATABASE_URL`.
- Forms use `react-hook-form` with `zodResolver`. For schemas used with `useForm<T>`, do not use Zod `.default()`; put defaults in `defaultValues` instead.
- In form tests, `handleSubmit` passes the submit event as a second argument, so assertions on submit spies must include `expect.anything()` for that second parameter.
- The fit-score algorithm exists in both `src/lib/fit-score/calculate.ts` and `services/fit-score/src/calculate.ts`; keep the input/output contract and scoring logic aligned when changing scoring behavior.
- The repository uses the `@/*` path alias for `src/*`.
