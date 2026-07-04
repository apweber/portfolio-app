# Deployment Guide

## Prerequisites

- Node.js 20+, pnpm 9+
- [Supabase](https://supabase.com) project (free tier is fine)
- [Vercel](https://vercel.com) account (for hosting the Next.js app)
- `psql` CLI for applying RLS policies

---

## 1. Environment variables

Copy `.env.example` to `.env.local` and fill in each value.

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-only) |
| `DATABASE_URL` | Pooled Postgres URL (PgBouncer, port 6543) |
| `DIRECT_URL` | Direct Postgres URL (port 5432, used for migrations) |
| `FIT_SCORE_SERVICE_URL` | URL of the app's own scoring route, e.g. `https://<app>.vercel.app/api/fit-score/calculate` |
| `FIT_SCORE_SECRET` | Shared bearer secret between app and fit-score service |
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployed Next.js app |

---

## 2. Database

Schema is managed by **Prisma migrations** (`prisma/migrations/`). Deploys to the
production Supabase database go through the `*:prod` scripts, which load
`.env.production.local` (gitignored) via `dotenv-cli` — your local `.env` (dev
Postgres) is never touched.

### One-time setup

1. Install the `psql` client (required by the RLS step) — e.g. `sudo dnf install -y postgresql`.
2. Create `.env.production.local` from the template and paste the connection string
   from **Supabase Dashboard → Connect**.

   > **Use a Session or Direct connection on port 5432** for these commands —
   > **not** the transaction pooler (`:6543`, `?pgbouncer=true`), which cannot run
   > migrations/DDL. (The app's *runtime* `DATABASE_URL` on Vercel *does* use the
   > `:6543` transaction pooler — that's set in Vercel env, separately.)

   ```dotenv
   # .env.production.local  (port 5432; URL-encode special chars in the password)
   DATABASE_URL="postgresql://postgres.<ref>:<PW>@aws-0-<region>.pooler.supabase.com:5432/postgres"
   DIRECT_URL="postgresql://postgres.<ref>:<PW>@aws-0-<region>.pooler.supabase.com:5432/postgres"
   SEED_ALICE_ID="<alice-auth-uuid>"
   SEED_ADMIN_ID="<admin-auth-uuid>"
   ```

### Deploy schema + RLS

```bash
pnpm db:status:prod   # sanity check: connects to Supabase, shows migration state
pnpm db:deploy:prod   # applies prisma/migrations
pnpm db:rls:prod      # applies prisma/rls.sql (auth.uid() resolves on Supabase)
```

> **Drift fallback:** if `db:deploy:prod` reports objects "already exist" (schema was
> created outside Prisma), baseline it once:
> `dotenv -e .env.production.local -- pnpm prisma migrate resolve --applied 20260522025838_init_job_tracker`, then re-run.

### Seed data (optional)

Create the two users in Supabase Auth (dashboard → Authentication → Users) —
`alice@example.com` and `admin@example.com` — copy their UUIDs into
`SEED_ALICE_ID` / `SEED_ADMIN_ID` in `.env.production.local`, then:

```bash
pnpm db:seed:prod
```

---

## 3. Fit-score service

Scoring is served **in-app** by the Next.js route `src/app/api/fit-score/calculate/route.ts`
— it runs on the same Vercel deployment as the rest of the app. The app calls it
through `scoreViaService()` (`src/lib/fit-score/client.ts`), so there is no separate
service to build or deploy.

Set two environment variables (in Vercel for production, `.env.local` for dev):

```bash
# Production: point at the app's own deployed URL
FIT_SCORE_SERVICE_URL=https://<app>.vercel.app/api/fit-score/calculate
# Local dev: point back at the local server
FIT_SCORE_SERVICE_URL=http://localhost:3000/api/fit-score/calculate

# Shared bearer secret guarding the scoring route (any value; must match on both sides)
FIT_SCORE_SECRET=your-shared-secret
```

> Because the app calls its own route over HTTP, `FIT_SCORE_SERVICE_URL` must be the
> full public URL of the deployment (not a relative path). This adds one internal
> HTTP hop per scoring request — the accepted trade-off for keeping scoring behind a
> stable, secret-guarded endpoint.

---

## 4. Next.js app

### Vercel

1. Import the repo in [vercel.com/new](https://vercel.com/new)
2. Add all environment variables from `.env.local` (including
   `FIT_SCORE_SERVICE_URL` = your Vercel app URL + `/api/fit-score/calculate`)
3. Deploy — Vercel detects Next.js automatically

---

## Architecture overview

```
Browser → Next.js on Vercel
             ├── Supabase Auth  (authentication)
             ├── Supabase Postgres + RLS  (data)
             └── /api/fit-score/calculate  (in-app scoring route,
                    called via FIT_SCORE_SERVICE_URL)
```
