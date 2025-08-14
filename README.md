# Rivor  Where Deals Flow Seamlessly

Monorepo: Next.js 14 (App Router), TypeScript, Prisma/Postgres, Redis/BullMQ, NextAuth (Google/Microsoft), Stripe, tRPC, Tailwind + shadcn/ui, Vitest/Playwright, Sentry, PostHog.

- App: apps/web
- Shared packages: packages/db, packages/crypto, packages/config, packages/queue

## Local
- Copy .env.example  .env
- (Optional) docker compose up -d for Postgres/Redis
- npm run prisma:generate --prefix packages/db
- npm run dev

## CI
- See .github/workflows/ci.yml (build/test + Postgres service)

## Deploy (Vercel)
- Import repo
- Framework: Next.js, Root Directory: apps/web
- Build Command: npm --prefix packages/db run prisma:generate && npm run build
- Install Command: npm install
- Set env vars from .env.example

## Environment Variables

Create a `.env` at the repo root (and/or per-app) with the following variables. See `.env.example` for the complete list.