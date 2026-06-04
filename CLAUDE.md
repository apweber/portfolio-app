# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Production build (runs TypeScript + Next.js)
pnpm lint         # ESLint
pnpm test         # Vitest in watch mode
pnpm test:run     # Vitest single run (all unit tests)
pnpm db:seed      # Seed development data (requires DATABASE_URL)
pnpm db:rls       # Apply RLS policies (requires DIRECT_URL)
pnpm prisma migrate deploy  # Run pending migrations
```

**Run a single test file:**
```bash
pnpm vitest run src/lib/fit-score/calculate.test.ts
```


## Architecture

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript 5 strict · Tailwind CSS 4 · Supabase Auth · Prisma 7 + `@prisma/adapter-pg` · Zod 4 · react-hook-form 7 · pnpm

This is a **multi-user job search tracker** with Supabase Auth, a Postgres database (via Prisma), and a standalone fit-score microservice.

### Route groups

```
src/app/
  (auth)/login, /register   — public pages (no layout guard)
  (app)/                    — protected; layout.tsx calls getCurrentProfile() → redirect /login
    admin/                  — admin-only; layout.tsx checks role=ADMIN → redirect /dashboard
    dashboard, jobs, companies, profile
  api/                      — REST API routes
    admin/jobs, admin/users — admin-only endpoints (requireAdmin())
    jobs, companies, skills, profile, fit-weights
    fit-score/calculate     — local dev proxy for the Cloud Run scoring service
```

### Authentication

- Supabase handles sessions (cookies via `@supabase/ssr`)
- `getCurrentProfile()` in `src/lib/auth.ts` reads the Supabase session then upserts a `Profile` row (Supabase UID becomes `Profile.id`)
- `requireAuth()` / `requireAdmin()` are called at the top of every API route handler
- The `(app)` layout is a **server component** that does the redirect; client pages trust this guard

### API shape

All API routes return `{ data: T, error: null }` on success or `{ data: null, error: { code, message, details? } }` on error — see `src/lib/api-response.ts`. Client code uses the typed helpers in `src/lib/api.ts`:

```typescript
import { get, post, patch, del } from "@/lib/api";
// get<T>(path) · post<T>(path, body) · patch<T>(path, body) · del<T>(path)
// throws ApiClientError on error envelopes
```

### Fit-score service

Scoring is extracted into a standalone Express service (`services/fit-score/`) intended for Cloud Run deployment. The app calls it via `scoreViaService()` in `src/lib/fit-score/client.ts`, which:
- Reads `FIT_SCORE_SERVICE_URL` + `FIT_SCORE_SECRET` env vars
- POSTs with a `Bearer` token, retries once on failure, returns `null` score on two failures

In local dev, set `FIT_SCORE_SERVICE_URL=http://localhost:3000/api/fit-score/calculate` to route through the built-in proxy instead of Cloud Run.

`services/` is excluded from the root `tsconfig.json` (it has its own) and from Vitest.

### Prisma

- Schema at `prisma/schema.prisma`; generated client at `src/generated/prisma/client`
- `PrismaClient` **requires** the `PrismaPg` adapter — always instantiate as in `src/lib/prisma.ts`:
  ```typescript
  new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })
  ```
- RLS policies are in `prisma/rls.sql` and applied separately after migrations

### Forms

All forms use **react-hook-form + zodResolver + Zod 4**. Two critical quirks:

1. **Never use `.default()` in form schemas.** It splits the Zod input/output types and breaks `useForm<T>`'s type inference. Use `defaultValues` in `useForm` instead.

2. **`handleSubmit` passes the submit event as a second argument** to the `onValid` callback. Test assertions for form submit spies must include `expect.anything()` as the second argument:
   ```typescript
   expect(onSubmit).toHaveBeenCalledWith(
     expect.objectContaining({ name: "..." }),
     expect.anything()  // ← RHF always passes the submit event
   );
   ```

### Testing

**Unit tests** (`src/**/*.test.{ts,tsx}`) — Vitest + RTL + jsdom, scoped to `src/` only.

- `vi.mock()` at file top (hoisted automatically)
- `vi.stubGlobal("confirm", vi.fn(() => true))` for dialogs; restore with `vi.unstubAllGlobals()` in `afterEach`
- `vi.stubEnv("VAR", "value")` for env vars; restore with `vi.unstubAllEnvs()` in `afterEach`

### Path alias

`@/*` resolves to `./src/*` (configured in `tsconfig.json` and `vitest.config.ts`).
