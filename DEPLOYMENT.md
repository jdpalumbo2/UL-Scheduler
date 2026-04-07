# Deployment

## Live URL

**Dashboard:** https://ul-scheduler-production.up.railway.app

- Login password: `ULSchedule`
- Health endpoint (public, no auth): https://ul-scheduler-production.up.railway.app/api/health

## Railway Project

- Project name: `trustworthy-delight`
- Project ID: `b3935853-6091-45d2-a5a4-5ed3e12c0377`
- Dashboard: https://railway.com/project/b3935853-6091-45d2-a5a4-5ed3e12c0377

Two services in this project:
1. **UL-Scheduler** - Next.js web app (always-on), port 3000
2. **curl** - Cron service (runs daily via `curlimages/curl`, offline between runs)

## Keepalive Cron

- Schedule: `0 14 * * *` (14:00 UTC daily)
- Implemented as a separate Railway cron service (`curl`) using the `curlimages/curl` Docker image
- Start command: `curl -f "https://ul-scheduler-production.up.railway.app/api/cron/keepalive?secret=ULSchedule"`

To manually trigger:
```
curl -f "https://ul-scheduler-production.up.railway.app/api/cron/keepalive?secret=ULSchedule"
```

To trigger via Railway UI: open the `curl` service > Cron Runs tab > "Run now".

## Environment Variables

Managed in Railway under the UL-Scheduler service > Variables tab:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `DASHBOARD_PASSWORD` | Dashboard login password (`ULSchedule`) |
| `NEXT_PUBLIC_APP_NAME` | App display name |

## Redeploy

Push to `main` on GitHub. Railway auto-deploys on every push.

```
git push origin main
```

## View Logs

- Web app logs: Railway > UL-Scheduler service > Deployments > View logs
- Cron run logs: Railway > `curl` service > Cron Runs tab or Deployments > View logs

## Health Check

`/api/health` is the public health check endpoint (no auth required). Railway uses it to verify the service is up.

## GitHub Repo

https://github.com/jdpalumbo2/UL-Scheduler
