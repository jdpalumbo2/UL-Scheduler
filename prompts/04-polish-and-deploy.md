# Phase 3 + 4: UI Polish + Railway Deployment

## Context

Read `CLAUDE.md` first. Phase 1 built scaffold + auth + keepalive. Phase 2 built metrics API + dashboard. This phase polishes the UI, applies a proper color theme, and deploys to Railway. This is the final phase. After this, the dashboard should be live and the keepalive cron should be running.

You have Chrome access for the Railway deployment portion. Use it only for the deployment step. Everything else should be local file edits in VS Code.

## Part 1: UI Polish (do this first, before deploying)

### 1.1 Color Palette

Apply this palette consistently across all pages. Define these as CSS custom properties in `app/globals.css` or as Tailwind theme extensions in `tailwind.config.ts` — your choice, pick whichever is cleaner. Use them everywhere.
```
Primary navy:        #1e3a5f   (headings, primary buttons, status text)
Primary navy dark:   #152a47   (hover states)
Accent teal:         #0d9488   (entreINCedu chart series, accent highlights)
Accent teal light:   #ccfbf1   (teal background fills)
Accent orange:       #ea580c   (INCubatoredu chart series)
Accent orange light: #ffedd5   (orange background fills)
Background:          #f8fafc   (page background)
Surface:             #ffffff   (cards)
Border:              #e2e8f0   (subtle dividers)
Text primary:        #0f172a   (slate-900 for headings + numbers)
Text secondary:      #475569   (slate-600 for labels + body)
Text muted:          #94a3b8   (slate-400 for footnotes)
Success green:       #16a34a
Warning amber:       #f59e0b
Error red:           #dc2626
```

The status banner uses success/warning/error backgrounds with white text. Everything else uses navy as the primary brand color and teal/orange as the data series colors.

Update the existing chart in `DailyChart.tsx` to use teal `#0d9488` for entreINCedu and orange `#ea580c` for INCubatoredu instead of whatever placeholder colors are currently there.

### 1.2 Login Page Fix

The current login page has poor contrast — light gray placeholder/dots on white background, password is barely visible. Rebuild it as follows:

- Full-screen centered card on a navy `#1e3a5f` background (use the primary navy)
- Card itself is white, rounded-2xl, shadow-xl, max-w-md, padding p-8
- Heading inside the card: "UL Scheduler Health Dashboard" in navy, large, bold
- Subtitle: "Sign in to continue" in slate-600
- Password input: explicit `text-slate-900`, `bg-slate-50`, `border border-slate-300`, focus ring in teal, padding py-3 px-4, rounded-lg, full width. The dots must be clearly visible — use `text-slate-900` not `text-gray-400`.
- Submit button: full width, navy background, white text, hover darkens to `#152a47`, rounded-lg, py-3, font-semibold
- Error message (if any): red text below the input

Make sure the input's text color is explicitly set so the password dots are dark and visible. This is the bug the user flagged.

### 1.3 Rename Throughout

Change every occurrence of "UL Scheduler Health" to "UL Scheduler Health Dashboard". Search the codebase for the old string. Update:
- Page title (HTML `<title>`)
- Main `<h1>` on the dashboard
- Login page heading
- README references if any
- The `NEXT_PUBLIC_APP_NAME` env var default if used

### 1.4 Top Submitters Component

Currently `TopSubmitters.tsx` has expand/collapse behavior. Remove it. Show the full top-10 list always. The component should:

- Title: "Top Submitters" in navy
- A simple ordered list of 10 entries
- Each entry: a row with the email on the left and the count on the right (use `flex justify-between`)
- Subtle dividers between rows (border-b border-slate-100, no border on the last item)
- Email in slate-700, count in navy bold
- No buttons, no chevrons, no useState

This becomes a server component if it isn't already, since it has no interactivity.

### 1.5 General Polish Pass

Review the dashboard and apply:

- Consistent rounded-xl on all cards (not mixed rounded-lg/rounded-xl)
- Consistent shadow: `shadow-sm` everywhere, no shadow-md or shadow-lg except the login card
- All section headings in navy, font-semibold, text-lg, mb-4
- All stat numbers in navy, font-bold, text-4xl
- All stat labels in slate-600, text-sm, uppercase tracking-wide
- The status banner: full-width, p-6, rounded-xl, with the status icon/text on the left and the timestamps on the right (or stacked on mobile)
- Footer: slate-500, text-xs, centered, with the refresh button as a small navy outlined button
- Header: white background, border-b border-slate-200, sticky top-0, with the "UL Scheduler Health Dashboard" title on the left and the logout button on the right

### 1.6 Self-Review

After the polish edits, do a self-review pass. Look at every page and component and ask:

- Is anything still using a placeholder gray that should be navy or slate?
- Are any text-color/background-color combinations low-contrast (fails WCAG AA)?
- Are mobile breakpoints handled cleanly for every section?
- Does the chart legend match the new colors?
- Does the status banner correctly show all three states (test by temporarily forcing each)?
- Are there any leftover console.logs or commented-out code?

Fix anything you find. Make any additional improvements you think are warranted, but do not change scope (no new metrics, no new pages).

### 1.7 Local Verification

Run `npm run build` to confirm the build still passes. Run `npm run dev` and visually verify the login page, dashboard, and logout flow all work and look good. Commit everything with a message like "Phase 3: UI polish, color theme, login fix".

## Part 2: Railway Deployment (Chrome required)

Now switch to Chrome-enabled mode for the deployment. Everything below requires browser access to railway.com.

### 2.1 Prep

The user is logged into Railway already. Their dashboard is at https://railway.com/dashboard. The GitHub repo for this project is already pushed.

Required env vars to set in Railway:
- `SUPABASE_URL` — get from the user, do NOT guess
- `SUPABASE_SERVICE_KEY` — get from the user, do NOT guess
- `DASHBOARD_PASSWORD=ULSchedule`

Before doing anything in Chrome, ask the user to paste the `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` values into the chat. Wait for them. Do not proceed without them.

### 2.2 Create Railway Project

1. Open https://railway.com/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Find and select the scheduler repo (ask the user for the exact repo name if you can't find it)
5. Let Railway auto-detect the Next.js app
6. Wait for the initial deployment to start

### 2.3 Set Environment Variables

1. Open the new service in Railway
2. Go to the Variables tab
3. Add the three env vars from section 2.1
4. Save and trigger a redeploy

### 2.4 Verify Deployment

1. Wait for the build to finish
2. Open the public URL Railway assigns (will be something like `<projectname>.up.railway.app`)
3. Hit `/api/health` directly in the browser — should return JSON with green/yellow status
4. Hit the root URL — should redirect to `/login`
5. Log in with `ULSchedule`
6. Verify the dashboard loads with real metrics

If any step fails, screenshot the error or paste the build log and report back to the user before continuing.

### 2.5 Configure Cron Job

Railway has a cron service feature. Add a cron job that hits the keepalive endpoint daily.

1. In the Railway project, add a new cron schedule (or check if cron is configured via the existing service)
2. Schedule: `0 14 * * *` (14:00 UTC daily)
3. Command: `curl -f "https://<railway-url>/api/cron/keepalive?secret=ULSchedule"`
4. Save

If Railway's cron setup differs from this (e.g., needs a separate worker service), figure it out from the Railway docs and document what you did. The goal is: once a day, the keepalive endpoint gets hit and queries Supabase.

### 2.6 Verify Cron

If possible, manually trigger the cron once to confirm it works. Check the logs in Railway to see the keepalive output. Confirm the `/api/health` endpoint now shows a recent `lastKeepalivePing` timestamp.

### 2.7 Document the Deployment

Create or update `DEPLOYMENT.md` at the repo root with:
- The live Railway URL
- The cron schedule and command
- Where env vars are managed
- How to redeploy (push to main)
- How to view logs
- How to manually trigger the keepalive

Commit and push.

## Done Criteria

- Login page is high-contrast, navy themed, password dots clearly visible
- Dashboard renamed to "UL Scheduler Health Dashboard" everywhere
- Top submitters shows all 10 with no expand/collapse
- Color palette consistently applied across all pages
- Chart uses teal and orange
- `npm run build` passes locally
- Live Railway URL is accessible
- Login works on the live URL
- Dashboard loads with real metrics on the live URL
- Cron job is configured and verified
- `DEPLOYMENT.md` is committed
- Final commit pushed

## Communication Rules

- No em dashes
- Report progress at clear checkpoints: after polish edits committed, after Railway project created, after env vars set, after deploy verified, after cron configured
- Ask for the Supabase credentials before opening Chrome
- If Railway's UI has changed and steps don't match exactly, adapt and document what you actually did
- If anything fails, stop and report back rather than guessing
- Do not commit secrets to git under any circumstances