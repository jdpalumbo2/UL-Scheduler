# Phase 2: Metrics API + Dashboard UI

## Context

Read `CLAUDE.md` at the repo root first. Phase 1 built the scaffold, auth, keepalive, and `/api/health`. This phase builds the metrics API routes AND the dashboard UI that consumes them. Build both in this single phase.

## Critical Data Notes

The Supabase data has known quirks. Build assuming these:

1. **Trust `is_latest`.** Even though current test data has duplicates, the user will fix this before production. Filter to `is_latest = true` for any "most recent per teacher" metric.
2. **Numeric fields are stored as strings.** `avg_minutes_per_week_in_class` and `weeks_remaining` come back as strings. Always `parseInt(value, 10)` and skip `NaN` values from aggregations.
3. **`certifications_selected` is a comma-separated string**, not an array. Values like `"PMI Project Management Ready® Certification"` or `"None"` or `"Intuit Design for Delight Innovator Certification, PMI Project Management Ready® Certification"`. Parse with `.split(', ').map(s => s.trim()).filter(s => s && s !== 'None')`.
4. **Email matching is always case-insensitive.** Lowercase before grouping, comparing, or counting.
5. **Program names have inconsistent casing.** `entreINCedu` and `InCubatoredu`. Match case-insensitively. For display, normalize to `entreINCedu` and `INCubatoredu`.
6. **`include_course_connections` is a real boolean.** No parsing needed.
7. **No test account exclusions.** Show all data including the user's own testing — that's intentional.

## Metrics to Build

### 1. Usage Overview
- Total schedules generated: all-time, last 30 days, last 7 days
- Split each by program (entreINCedu vs INCubatoredu)
- Last 30 days daily chart: schedules generated per day, stacked by program

### 2. Teachers
- Unique teachers all-time (distinct lowercased emails)
- Unique teachers active in last 30 days
- New vs returning ratio: a "returning" teacher is one whose first submission was before the last 30 days AND has at least one submission in the last 30 days. "New" means first submission was within the last 30 days.
- Average submissions per teacher (total rows / distinct lowercased emails)
- Top submitters dropdown: ordered list of email + submission count, descending. Show top 10 in a dropdown/expandable list.

### 3. Teacher Behavior (entreINCedu only, most recent submission per teacher)
- Average minutes per week (across most recent submission per teacher, lowercased email grouped)
- Certification opt-in rates: for each of the three certifications, percent of entreINCedu teachers (most recent submission only) who selected it. Three certs:
  - `Intuit Design for Delight Innovator Certification`
  - `PMI Project Management Ready® Certification`
  - `Entrepreneurship and Small Business (ESBv2)`
- Course Connections opt-in rate: percent of entreINCedu teachers (most recent submission only) with `include_course_connections = true`

### 4. System Health
- Supabase reachable (boolean + timestamp of last check)
- Last keepalive cron run timestamp
- Days since most recent real teacher submission
- Status indicator with this exact logic:
  - **Green**: Supabase reachable AND a submission in the last 7 days
  - **Yellow**: Supabase reachable AND no submissions in 7+ days
  - **Red**: Supabase unreachable

## API Routes to Build

Create these route handlers under `app/api/metrics/`. All return JSON. All require auth (covered by existing middleware). Use `force-dynamic` on each.

### `/api/metrics/usage` (GET)
Returns:
```json
{
  "totals": {
    "allTime": { "total": number, "entreINC": number, "incubator": number },
    "last30Days": { "total": number, "entreINC": number, "incubator": number },
    "last7Days": { "total": number, "entreINC": number, "incubator": number }
  },
  "dailyChart": [
    { "date": "YYYY-MM-DD", "entreINC": number, "incubator": number }
  ]
}
```

The `dailyChart` array should have exactly 30 entries, one per day, including days with zero submissions. Use UTC dates.

### `/api/metrics/teachers` (GET)
Returns:
```json
{
  "uniqueAllTime": number,
  "uniqueLast30Days": number,
  "newLast30Days": number,
  "returningLast30Days": number,
  "avgSubmissionsPerTeacher": number,
  "topSubmitters": [
    { "email": string, "count": number }
  ]
}
```

`topSubmitters` is the top 10, descending by count.

### `/api/metrics/behavior` (GET)
Returns:
```json
{
  "entreINCTeacherCount": number,
  "avgMinutesPerWeek": number,
  "certifications": {
    "intuit": { "count": number, "percent": number },
    "pmi": { "count": number, "percent": number },
    "esb": { "count": number, "percent": number }
  },
  "courseConnections": { "count": number, "percent": number }
}
```

All percentages are 0-100, rounded to 1 decimal. `entreINCTeacherCount` is the denominator used for all percentages — distinct lowercased emails with at least one entreINCedu submission, considering only their most recent entreINCedu submission.

## Implementation Notes

Create `lib/metrics/queries.ts` with reusable Supabase query helpers:
- `getAllSubmissions()` — fetches all rows with relevant columns, used by all routes (cache the result per request via React `cache()` if helpful, or just fetch fresh each time — there are only 100ish rows)
- Helper functions for normalization: `normalizeEmail`, `normalizeProgram`, `parseCertifications`, `parseIntSafe`

For the most-recent-per-teacher logic, sort by `submission_date` desc, then group by lowercased email + normalized program, keeping the first occurrence per group.

## Dashboard UI

Replace the placeholder home page (`app/page.tsx`) with the real dashboard. Use Tailwind. Install `recharts` for the daily chart.

### Layout

Single page, responsive, max-width container centered. Sections in this order top to bottom:

1. **Header**: "UL Scheduler Health" title, subtitle "Uncharted Learning scheduling bot monitor", logout button top-right
2. **Status banner**: Large colored banner (green/yellow/red) showing system status. One sentence describing the state. Show last keepalive ping and days since last submission as small text underneath.
3. **Usage cards row**: Three cards side-by-side (stack on mobile): "All Time", "Last 30 Days", "Last 7 Days". Each card shows total number prominently, with a small two-line breakdown underneath: "X entreINCedu" and "Y INCubatoredu".
4. **Daily chart**: Stacked bar chart of last 30 days, two series (entreINCedu and INCubatoredu). Use Recharts. Title: "Last 30 Days". Hide the chart's gridlines for a cleaner look. Use distinct colors for the two programs (pick something pleasant — maybe a teal and an amber).
5. **Teachers section**: Two columns on desktop, stacked on mobile.
   - Left column: Four stat cards in a 2x2 grid — Unique Teachers (All Time), Active (Last 30 Days), New (Last 30 Days), Returning (Last 30 Days). Plus a single-line "Avg submissions per teacher: X.X"
   - Right column: "Top Submitters" expandable card. Collapsed by default, shows just the top entry. Click to expand and reveal all 10 with their counts. Use a `<details>` element or a simple useState toggle.
6. **Behavior section** (entreINCedu only): A card with the heading "entreINCedu Teacher Behavior". Inside:
   - "Based on most recent submission from N teachers" subtitle
   - "Avg minutes per week: X" stat
   - Three horizontal progress bars for certifications, each showing the cert name, count, and percent
   - One horizontal progress bar for Course Connections opt-in
7. **Footer**: Small text with last data refresh timestamp and a manual refresh button that re-fetches all metrics.

### Styling Guidelines

- Use a clean, professional palette. Slate grays for text, white card backgrounds, subtle shadows
- The status banner is the only loud element — green-500, yellow-500, or red-500 background
- Cards: white background, rounded-xl, shadow-sm, p-6
- Numbers should be large and prominent (text-4xl font-bold for primary stats)
- Use Tailwind's `gap` utilities for spacing, no manual margins
- Avoid emojis in the UI itself — keep it professional looking
- Mobile-first: everything stacks below `md:` breakpoint

### Data Fetching

In `app/page.tsx` (server component), fetch from all four endpoints in parallel:
- `/api/health`
- `/api/metrics/usage`
- `/api/metrics/teachers`
- `/api/metrics/behavior`

Use `fetch` with `cache: 'no-store'` so the page always shows fresh data on load. Pass data into client components for the chart and the expandable top submitters list.

For the manual refresh button, use a client component that calls `router.refresh()`.

### Loading and Error States

- Show a minimal skeleton or "Loading..." state if any fetch fails — log the error to the console and display a small error indicator on the affected card without breaking the rest of the page.
- If the health endpoint reports red, the entire status banner is red and the metrics sections still render normally (the data is stale-but-valid).

## Out of Scope

- Authentication changes (already done in phase 1)
- Deployment (phase 4)
- Tests
- Custom domain
- The keepalive worker (already done in phase 1)

## Done Criteria

- All four API routes return correct JSON shapes
- Dashboard renders without errors against the live Supabase data
- Status banner correctly reflects current state
- Daily chart shows real data
- Top submitters dropdown expands and shows top 10
- Behavior section calculates percentages correctly
- Refresh button works
- Mobile layout doesn't break
- All files committed

## Communication Rules

- No em dashes anywhere
- Report progress at clear checkpoints: after API routes, after dashboard layout, after data wired up, after styling polish
- Ask before making non-trivial design choices not covered here
- If you discover the data shape differs from what's documented above, stop and report back rather than guessing