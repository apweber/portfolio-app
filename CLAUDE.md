# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev      # Start dev server at localhost:3000
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

No test runner is configured yet.

## Architecture

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · pnpm

This is a **frontend-only** portfolio application — no backend, API routes, or database.

**Key conventions**:
- All source lives under `src/app/` using the Next.js App Router (not Pages Router)
- Components are React Server Components by default; add `"use client"` only when needed
- Path alias `@/*` resolves to `./src/*` (configured in `tsconfig.json`)
- Tailwind CSS v4 via PostCSS — no `tailwind.config.*` file; configure via CSS variables in `globals.css`
- Fonts loaded via `next/font` (Geist, from Vercel)
