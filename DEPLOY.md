# Deployment Guide

## Prerequisites

- Node.js 20+, pnpm 9+
- [Supabase](https://supabase.com) project (free tier is fine)
- [Google Cloud](https://cloud.google.com) project with Cloud Run enabled
- `psql` CLI for applying RLS policies
- `gcloud` CLI authenticated (`gcloud auth login`)

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
| `FIT_SCORE_SERVICE_URL` | Cloud Run service URL (set after step 3) |
| `FIT_SCORE_SECRET` | Shared bearer secret between app and fit-score service |
| `NEXT_PUBLIC_APP_URL` | Public URL of the deployed Next.js app |

---

## 2. Database

### Run migrations

```bash
pnpm prisma migrate deploy
```

### Apply Row-Level Security

```bash
pnpm db:rls          # runs: psql $DIRECT_URL -f prisma/rls.sql
```

### Seed development data (optional)

Create the two seed users in Supabase Auth (dashboard → Authentication → Users),
then copy their UUIDs into env vars:

```bash
export SEED_ALICE_ID=<alice-supabase-uuid>
export SEED_ADMIN_ID=<admin-supabase-uuid>
pnpm db:seed
```

---

## 3. Fit-score Cloud Run service

The standalone scoring service lives in `services/fit-score/`.

### Build and push

```bash
cd services/fit-score
gcloud builds submit \
  --tag gcr.io/$PROJECT_ID/fit-score-service \
  --project $PROJECT_ID
```

### Deploy

```bash
gcloud run deploy fit-score-service \
  --image gcr.io/$PROJECT_ID/fit-score-service \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars FIT_SCORE_SECRET=$FIT_SCORE_SECRET \
  --project $PROJECT_ID
```

Copy the printed service URL and set it as `FIT_SCORE_SERVICE_URL` in your Next.js environment.

### Local development proxy

When running locally without Cloud Run, set:

```bash
FIT_SCORE_SERVICE_URL=http://localhost:3000/api/fit-score/calculate
FIT_SCORE_SECRET=any-local-secret
```

The internal Next.js proxy route will handle scoring locally.

---

## 4. Next.js app

### Vercel (recommended)

1. Import the repo in [vercel.com/new](https://vercel.com/new)
2. Add all environment variables from `.env.local`
3. Deploy — Vercel detects Next.js automatically

### Cloud Run

```bash
# From the project root
gcloud builds submit \
  --tag gcr.io/$PROJECT_ID/portfolio-app \
  --project $PROJECT_ID

gcloud run deploy portfolio-app \
  --image gcr.io/$PROJECT_ID/portfolio-app \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "$(cat .env.local | grep -v '^#' | tr '\n' ',')" \
  --project $PROJECT_ID
```

---

## Architecture overview

```
Browser → Next.js (Vercel / Cloud Run)
             ├── Supabase Auth  (authentication)
             ├── Supabase Postgres + RLS  (data)
             └── fit-score Cloud Run  (scoring service)
                    ↑
              /api/fit-score/calculate  (local dev proxy)
```
