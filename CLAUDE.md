# Uncharted Learning Scheduler — Health Monitor

## Project Purpose

This repo contains a Railway-deployed Node.js service that does two things:

1. **Keepalive worker** — pings the Supabase database daily so the free tier never auto-pauses (Supabase free tier pauses after 5 days of inactivity). Teachers use the scheduling tool roughly once a week, so without this, the DB could pause between uses.
2. **Health dashboard** — a web UI showing usage metrics, teacher behavior insights, and system health for the scheduling bot.

The scheduling bot itself is **not** in this repo. It lives in n8n and is called by a Lovable-built frontend hosted on SiteGround. None of that infrastructure should change.

## Related Systems (read-only references)

- **Scheduling bot frontend (Lovable on SiteGround):** https://tools.unchartedlearning.org/schedulingagent/
  - Password: `ULSchedule`
  - Use Chrome screen-share to inspect if needed
- **n8n workflow:** Hosted on n8n cloud. The full workflow JSON is checked into this repo at `/reference/n8n-workflow.json` for reference only — do not modify it from here.
- **Supabase:** Database lives in the `UL Scheduler` Supabase project. Tables: `Teacher Informantion` (sic — typo is in production, do not "fix"), `EntreINC`, `Incubator`. Currently ~160 rows in `Teacher Informantion`.
- **Railway dashboard:** https://railway.com/dashboard
- **Vercel dashboard:** https://vercel.com/jdpalumbo2s-projects (only used if we split frontend off — current plan is all-on-Railway)

## Deployment Target

**Single Railway service, all-in-one Next.js app.** The app contains:
- API routes for metrics + health
- Cron worker (Railway cron schedule, runs once daily)
- Dashboard UI (Next.js pages, password-protected)

Avoid splitting into Railway+Vercel unless explicitly asked. Single deploy = simpler ops.

## Tech Stack

- Node.js + TypeScript
- Next.js (App Router) for the dashboard
- Supabase JS client (`@supabase/supabase-js`) for DB reads
- Recharts for visualizations
- Tailwind for styling
- Railway cron for the daily keepalive

## Environment Variables
SUPABASE_URL=                  # from Supabase project settings
SUPABASE_SERVICE_KEY=          # read-only key preferred — generate restricted key
DASHBOARD_PASSWORD=            # single shared password for dashboard auth
NEXT_PUBLIC_APP_NAME=UL Scheduler Health

## Supabase Schema (read-only access)

### `Teacher Informantion`
Primary submission log. One row per schedule generated. Key fields:
- `id`, `teacher_name`, `teacher_email`
- `program_selection` — `"entreINCedu"` or `"InCubatoredu"` (note inconsistent casing)
- `submission_date`, `is_latest`
- `avg_minutes_per_week_in_class`, `weeks_remaining`, `current_curriculum_position`
- `certifications_selected`, `modules_to_skip`, `modules_completed`, `include_course_connections` (entreINC only)
- `mvp_pitch_week` (INCubator only)

### `EntreINC` and `Incubator`
Curriculum reference tables — lessons, modules, priorities. Read-only. The scheduling logic in n8n consumes these. We don't write to them.

## Dashboard Metrics to Implement

### Usage
- Total schedules all-time / last 30d / last 7d
- Split by program (entreINCedu vs INCubatoredu)
- Unique teachers (all-time, active last 30d)
- New vs returning user ratio
- Daily schedule generation chart (last 30d sparkline)
- Day-of-week heatmap

### Teacher Behavior
- Avg minutes/week distribution (histogram)
- Avg weeks remaining at first submission
- Most common starting `currentLesson`
- Most-skipped modules (entreINC)
- Certification opt-in rates
- Course Connections opt-in rate
- Returning user cadence (avg days between submissions per teacher)

### System Health
- Supabase connection status + last successful ping
- Last cron run + next scheduled run
- Days since most recent real teacher submission (alert if >14d)
- Row counts per table
- Status banner: 🟢 healthy / 🟡 warning / 🔴 down

### Curriculum Insights
- Most common MVP pitch week
- `currentLesson` starting position distribution
- Trend in `weeksRemaining` over time

## Keepalive Worker

- Runs daily via Railway cron
- Performs a lightweight `SELECT count(*)` on `Teacher Informantion`, `EntreINC`, `Incubator`
- Logs success/failure with timestamp to a small `health_log` table (create on first run if it doesn't exist) OR to Railway logs
- Updates a `last_ping` timestamp the dashboard reads

## Auth

Dashboard is password-protected with a single shared password (env var `DASHBOARD_PASSWORD`). No user accounts. Use a simple middleware check on all routes except `/api/health` (which should be public for Railway healthchecks).

## What NOT to Touch

- The n8n workflow (it's referenced for context only)
- The Lovable frontend on SiteGround
- Any Supabase table schemas or existing rows
- The "Teacher Informantion" typo in the table name — it's production, leave it

## Communication Style for This Project

- No em dashes
- Concise, direct
- Ask questions before generating large files when the answer would change the structure
- For multi-step tasks, report progress at clear phase boundaries
- Use parallel agents for non-conflicting work (e.g., scaffolding API + UI simultaneously)

## Open Questions / Decisions Pending

- Custom domain vs railway.app subdomain
- Dashboard password: reuse `ULSchedule` or new one
- Whether to add a dedicated `schedule_events` table in n8n later for cleaner tracking (deferred — existing `Teacher Informantion` data is sufficient for v1)
