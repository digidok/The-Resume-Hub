# Resume Hub

A platform to build a resume, share it publicly, apply to jobs, and get AI-assisted
feedback on it.

## Features

- **Resume builder** — form-based editor with a live preview, 3 templates, and PDF export
  (browser print).
- **Public sharing** — every resume gets a shareable link at `/r/<slug>`.
- **Job board** — employers post jobs; candidates browse and apply with one of their resumes.
- **AI resume review** — ATS-style scoring and feedback via the Claude API, optionally
  tailored to a pasted job description.
- **Accounts** — candidate and employer roles, backed by Supabase Auth (email/password).

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) — Postgres, Auth, Row Level Security
- [Tailwind CSS v4](https://tailwindcss.com)
- [Anthropic Claude API](https://platform.claude.com) — AI resume review (optional)

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your Supabase project's URL and anon/publishable
   key (Project Settings → API in the Supabase dashboard). `ANTHROPIC_API_KEY` is optional — without
   it, the AI review feature returns a friendly "not configured" message instead of erroring.

   ```bash
   cp .env.example .env.local
   ```

3. Apply the SQL files in `supabase/migrations/` to your Supabase project, in order (via the SQL
   editor, the Supabase CLI, or MCP tooling). They create `profiles`, `resumes`, `jobs`,
   `applications`, and `ai_reviews` tables with Row Level Security policies, plus a trigger that
   creates a `profiles` row whenever a new user signs up.

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Notes on auth

Supabase requires email confirmation by default. If your project has an email provider configured,
new users receive a confirmation link; otherwise you can disable "Confirm email" under
Authentication → Providers → Email in the Supabase dashboard for easier local testing, or manually
set `email_confirmed_at` on the `auth.users` row.

## Project structure

- `src/app` — routes (App Router). `dashboard/` is the authenticated area; `jobs/`, `r/`, `login`,
  `signup` are public.
- `src/lib/*/actions.ts` — Server Actions for auth, resumes, jobs, and applications.
- `src/components` — UI components, grouped by feature (`resume/`, `jobs/`, `auth/`, `ui/`).
- `src/proxy.ts` — Next.js 16's renamed `middleware.ts`; refreshes the Supabase session cookie and
  gates `/dashboard` routes.

## Deploying

Deploy to [Vercel](https://vercel.com/new) (or any Next.js host). Set the same environment variables
from `.env.local` in your hosting provider's dashboard.
