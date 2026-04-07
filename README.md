# UL Scheduler Health Dashboard

A Railway-deployed Next.js service that keeps the Uncharted Learning Scheduler database alive and provides a health dashboard.

## What it does

1. **Keepalive worker** - Pings the Supabase database daily via a cron job to prevent the free tier from auto-pausing (Supabase pauses after 5 days of inactivity).
2. **Health dashboard** - Web UI showing usage metrics, teacher behavior insights, and system health (coming in phase 2).

The scheduling bot itself lives in n8n and is called by a Lovable-built frontend. This service only monitors and keeps alive the database.

## Local Development

```bash
npm install
cp .env.local.example .env.local
# Fill in SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
npm run dev
```

Visit `http://localhost:3000`. You will be redirected to `/login`. Enter the `DASHBOARD_PASSWORD` value from your `.env.local`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | From Supabase project settings > API |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key from Supabase (server-side only, never exposed to client) |
| `DASHBOARD_PASSWORD` | Yes | Single shared password protecting the dashboard |
| `NEXT_PUBLIC_APP_NAME` | No | Display name, defaults to "UL Scheduler Health" |

## Key Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/health` | Public | System health status JSON |
| `GET /api/cron/keepalive` | Cron header or `?secret=` | Daily keepalive ping to Supabase |
| `POST /api/auth/login` | Public | Set auth cookie |
| `POST /api/auth/logout` | Public | Clear auth cookie |

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Railway setup instructions including cron job configuration.

Railway dashboard: https://railway.com/dashboard

## Project Context

See [CLAUDE.md](CLAUDE.md) for full project context, Supabase schema details, and related systems.
