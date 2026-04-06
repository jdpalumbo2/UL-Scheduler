# Phase 1: Scaffold + Keepalive Worker + Health Endpoint

## Context

You are building the foundation of the Uncharted Learning Scheduler Health Monitor. Read `CLAUDE.md` at the repo root first for full project context. This is phase 1 of 4. Do not build dashboard UI or metrics routes in this phase — those come later. Stay focused on the scope below.

## Scope for This Phase

1. Scaffold a Next.js 14 App Router project with TypeScript and Tailwind at the repo root
2. Install and configure Supabase client
3. Build password-protection middleware
4. Build the daily keepalive cron worker
5. Build `/api/health` endpoint (public, no auth)
6. Set up Railway deployment config

Nothing else. No dashboard pages. No metrics routes. No charts.

## Detailed Requirements

### 1. Project Setup

- Initialize Next.js 14 with App Router, TypeScript, Tailwind, ESLint
- Use `npm` (not pnpm or yarn)
- Install dependencies: `@supabase/supabase-js`, `date-fns`
- Create `.env.local.example` with all required env vars listed (do not create `.env.local` itself — user will do that)
- Create `.gitignore` entries for `.env.local`, `.next`, `node_modules`

### 2. Environment Variables

Document these in `.env.local.example`:
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
DASHBOARD_PASSWORD=ULSchedule

### 3. Supabase Client

Create `lib/supabase.ts` that exports a singleton Supabase client using `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`. Server-side only. Do not expose the service key to the client.

Important: The main submission table is named `Teacher Informantion` (with the typo). Do NOT correct it. All queries must use that exact spelling, quoted if needed.

### 4. Password Middleware

Create `middleware.ts` at the repo root that:
- Protects all routes EXCEPT `/api/health` and `/login`
- Checks for a cookie named `dashboard_auth` with value matching `DASHBOARD_PASSWORD`
- Redirects unauthenticated requests to `/login`

Create a minimal `/login` page with a single password input. On submit, POST to `/api/auth/login` which validates the password against the env var and sets the `dashboard_auth` cookie (httpOnly, secure, sameSite lax, 30-day expiry). On success, redirect to `/`.

Create `/api/auth/logout` that clears the cookie.

The `/` page for now should just be a placeholder that says "UL Scheduler Health — Dashboard coming in phase 2" so we can verify auth works.

### 5. Keepalive Cron Worker

Create `/api/cron/keepalive` as a Next.js route handler (GET). When called:
- Performs a `SELECT count(*)` on `Teacher Informantion`
- Logs the result to console with timestamp
- Returns JSON: `{ ok: true, timestamp, rowCount }` on success or `{ ok: false, error }` on failure
- Protect this endpoint with a check that the request has header `x-railway-cron: true` OR query param `?secret=<DASHBOARD_PASSWORD>`. Railway cron jobs can set custom headers.

Store the last successful ping timestamp in-memory in a module-level variable exported from `lib/health-state.ts`. It's fine that this resets on deploy — we don't need persistence for v1. The variable should be readable by `/api/health`.

### 6. Health Endpoint

Create `/api/health` as a public GET endpoint (no auth). Returns JSON:
```json
{
  "status": "green" | "yellow" | "red",
  "supabaseReachable": boolean,
  "lastKeepalivePing": ISO timestamp or null,
  "lastTeacherSubmission": ISO timestamp or null,
  "daysSinceLastSubmission": number or null,
  "timestamp": ISO timestamp
}
```

Status logic:
- **red**: Supabase unreachable (query throws)
- **yellow**: Supabase reachable but no submissions in last 7 days
- **green**: Supabase reachable AND a submission in the last 7 days

To get `lastTeacherSubmission`, query the `Teacher Informantion` table ordered by `submission_date` desc, limit 1. Use the `submission_date` field.

This endpoint performs a live Supabase query each time it's called, so it doubles as a secondary keepalive.

### 7. Railway Config

Create `railway.json` at the repo root with:
- Build command: `npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

Create a `railway.toml` or document in a `DEPLOYMENT.md` file how to set up the Railway cron job to hit `/api/cron/keepalive` once per day. Use Railway's cron schedule syntax. Run at 14:00 UTC (mid-morning US).

### 8. README

Create a `README.md` with:
- Project purpose (1 paragraph)
- How to run locally (`npm install`, copy `.env.local.example`, `npm run dev`)
- Env var documentation
- Link to Railway dashboard
- Reference to `CLAUDE.md` for full context

## Out of Scope (Do Not Build)

- Dashboard pages beyond the placeholder
- Metrics API routes
- Charts or visualizations
- The actual Railway deployment (phase 4 handles that)
- Tests (not needed for v1)

## Done Criteria

- `npm run dev` starts the app locally
- Visiting `/` redirects to `/login`
- Entering the password sets a cookie and redirects to `/` which shows the placeholder
- `/api/health` returns valid JSON without auth
- `/api/cron/keepalive?secret=<password>` successfully queries Supabase and logs the result
- All files committed

## Communication Rules

- No em dashes in any code comments or docs
- Report progress at clear checkpoints: after scaffold, after auth works, after keepalive works, after health endpoint works
- Ask before making architectural choices not covered here
- Do not start phase 2 work. Stop when done criteria are met and summarize what was built.
