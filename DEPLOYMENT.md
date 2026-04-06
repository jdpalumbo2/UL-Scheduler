# Deployment Guide

## Railway Setup

### Service Configuration

The `railway.json` at the repo root configures the build and start commands automatically.

Set the following environment variables in your Railway service:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | From Supabase project settings > API |
| `SUPABASE_SERVICE_KEY` | Service role key from Supabase project settings > API |
| `DASHBOARD_PASSWORD` | Shared password for the dashboard (e.g. ULSchedule) |
| `NEXT_PUBLIC_APP_NAME` | Display name (set to `UL Scheduler Health`) |

### Cron Job

Add a Railway cron job in the Railway dashboard for the keepalive worker:

- **Schedule:** `0 14 * * *` (runs daily at 14:00 UTC)
- **Command:** `curl -s -H "x-railway-cron: true" https://<your-domain>/api/cron/keepalive`

Or use the secret param approach if Railway cron does not support custom headers:

- **Command:** `curl -s "https://<your-domain>/api/cron/keepalive?secret=<DASHBOARD_PASSWORD>"`

Railway cron documentation: https://docs.railway.com/reference/cron-jobs

### Health Check

Railway uses `/api/health` as the health check endpoint. This is a public route that returns JSON with system status. No auth required.

### Local Development

See README.md for local setup instructions.
