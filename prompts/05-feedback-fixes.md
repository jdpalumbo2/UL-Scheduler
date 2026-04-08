# Phase 5: Client Feedback Fixes + Modernization

## Context

Read `CLAUDE.md` first. The dashboard is live at https://ul-scheduler-production.up.railway.app/ and the client (Ashley from Uncharted Learning) gave feedback. This phase addresses her feedback, fixes a real bug with the refresh button, adds a new INCubatoredu behavior section, adds program teacher counts, and modernizes the overall look.

## Scope

1. Fix the refresh button / stale data bug (real bug, high priority)
2. Add program teacher counts (entreINC teachers, INC teachers, teachers who teach both)
3. Relabel the entreINC behavior section to remove the "N=5 feels like a sample" confusion
4. Add a new INCubatoredu behavior section with curriculum-position metrics
5. Pull a refined color theme from https://www.unchartedlearning.org/ and modernize the UI

Do not add new API endpoints unless strictly necessary. Extend the existing ones where possible. Do not touch auth, keepalive, or Railway config.

## 1. Fix the Refresh Button Bug (DO THIS FIRST)

### Diagnosis

The "last updated" timestamp on the footer currently shows the deploy time, not the current time. That means `app/page.tsx` is being statically rendered at build time and cached. When the user clicks refresh, `router.refresh()` has nothing new to fetch.

### Fix

In `app/page.tsx`, add at the top:

```typescript
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

Verify that the `lastUpdated` timestamp displayed in the footer is computed inside the component body (e.g., `const lastUpdated = new Date()`) so it recomputes on every request, not at module scope.

Also verify the Supabase fetch calls in `lib/metrics/queries.ts` do not have any `cache: 'force-cache'` or long `revalidate` settings. If the page-level config is correct, the Supabase client queries should naturally re-run per request.

After the fix, the "last updated" timestamp should change every time the page is loaded or refreshed.

### Verification Step

Run `npm run build` and check the build output. The page should show as `ƒ (Dynamic)` in the route summary, not `○ (Static)`. If it still shows static, something else is caching and you need to track it down.

## 2. Program Teacher Counts

Add a new section between the status banner and the usage cards titled "Program Reach". Three stat cards in a row (stack on mobile):

- **entreINCedu Teachers**: distinct lowercased emails that have at least one entreINCedu submission
- **INCubatoredu Teachers**: distinct lowercased emails that have at least one INCubatoredu submission
- **Teachers Running Both**: distinct lowercased emails that have at least one submission of each program

A teacher who teaches both should be counted in all three cards. Make that explicit with a small footnote under the third card: "Teachers in this group also appear in the counts above."

### API Changes

Extend `/api/metrics/teachers` to return:

```json
{
  ...existing fields...,
  "programReach": {
    "entreINCTeachers": number,
    "incubatorTeachers": number,
    "bothPrograms": number
  }
}
```

Or add it as a top-level field alongside the existing ones. Your call.

Note: since `app/page.tsx` is a server component that uses `lib/metrics/queries.ts` directly (not HTTP self-fetch), you may not need to update the API route JSON at all — just add a new compute helper and use it in the page. Only update the API route if you want to keep the public API complete. Prefer the direct-compute path if it's cleaner.

## 3. Fix the entreINC Behavior Label

Currently the section says something like "Based on most recent submission from N teachers" which Ashley read as "only 5 submissions used."

Change the section:

- Heading: "entreINCedu Teacher Behavior"
- Subtitle, prominent: "Based on **N unique teachers**" where N is big and bold
- Secondary line, smaller, slate-500: "Showing each teacher's most recent submission"

This makes it obvious that N is a population count, not a sample size. The word "unique" does a lot of work here.

## 4. New INCubatoredu Behavior Section

Add a new section below the entreINC behavior section. Same card treatment.

### Heading

"INCubatoredu Teacher Behavior"

Subtitle prominent: "Based on **N unique teachers**" (same pattern as entreINC)
Secondary line: "Showing each teacher's most recent submission"

### Metrics

Compute these from the most-recent-per-teacher subset of INCubatoredu submissions. All data fields are already in the Supabase rows.

1. **Average minutes per week**
   - Parse `avg_minutes_per_week_in_class` as int, average, round
   - Display as a large stat number

2. **Average MVP pitch week**
   - `mvp_pitch_week` is a string like `"Week 25"` or sometimes `"Already occurred"` or null
   - Parse with a regex: `/Week (\d+)/` to extract the number. Skip nulls and "Already occurred" values from the average.
   - Display as "Week X" where X is the rounded average
   - Show a sub-label: "Across N teachers who have an upcoming pitch" so the denominator is clear

3. **MVP pitch week distribution**
   - A small histogram or bar chart showing how many teachers have their MVP pitch scheduled for which week range. Bucket into ranges: "Weeks 1-10", "Weeks 11-20", "Weeks 21-30", "Weeks 31+", "Already occurred"
   - Simple Recharts bar chart, use the accent orange color for the bars
   - This visually answers "when do INC teachers typically schedule their MVP pitch?"

4. **Starting curriculum position distribution**
   - `current_curriculum_position` is a string like `"1.1"` or `"3.2"`. It represents where the teacher is when they first use the tool.
   - For this metric, use each teacher's FIRST (earliest by submission_date) submission, not their most recent, because we want to know where teachers are when they onboard to the tool
   - Group by the unit number (the integer before the dot): "Unit 1", "Unit 2", through "Unit 8"
   - Show as a horizontal bar chart with counts per unit
   - Use the accent orange color
   - Label it "Where teachers are when they first use the tool"
   - Add a small helper text: "INCubatoredu is a linear curriculum with 8 units"

### Layout

The INCubatoredu behavior section should have:
- Top row: three stat cards (teacher count, avg minutes/week, avg MVP pitch week)
- Middle: MVP pitch week distribution chart
- Bottom: starting curriculum position chart

Stack vertically on mobile. Two charts can sit side-by-side on desktop at `lg:` breakpoint, or stacked — your call, whichever looks cleaner.

### Implementation

Add `computeIncubatorBehavior()` to `lib/metrics/queries.ts` that returns:

```typescript
{
  teacherCount: number;
  avgMinutesPerWeek: number;
  avgMvpPitchWeek: number;          // rounded, null if no valid data
  mvpPitchTeacherCount: number;     // denominator for the avg
  mvpPitchDistribution: Array<{ bucket: string; count: number }>;
  startingPositionDistribution: Array<{ unit: string; count: number }>;
}
```

Mirror the pattern of the existing `computeBehavior()` function for entreINC. Extract a shared helper for "most recent submission per teacher" if the logic is duplicated.

Use this compute function directly in `app/page.tsx`. Optionally expose via `/api/metrics/incubator-behavior` if you want API parity, but it's not required.

## 5. Color Theme + Modernization

Pull a more refined palette from https://www.unchartedlearning.org/. Their brand is deep navy + bold orange on white, with a clean professional feel. The current dashboard is on the right track but feels a bit flat and cramped.

### Updated Palette

Replace the existing palette with this refined version. Define in `tailwind.config.ts` as theme extensions:

```
Brand navy:          #0f2a47   (primary — headings, primary buttons, chart axis)
Brand navy dark:     #081a30   (hover states)
Brand navy light:    #1e3a5f   (secondary headings, borders on dark sections)

Brand orange:        #f97316   (INCubatoredu chart series, accent CTAs)
Brand orange dark:   #ea580c   (hover states)
Brand orange light:  #fed7aa   (orange background fills)

Brand teal:          #0d9488   (entreINCedu chart series)
Brand teal light:    #ccfbf1   (teal background fills)

Background:          #fafbfc   (page background — very slight warm tint off pure white)
Surface:             #ffffff   (cards)
Surface elevated:    #ffffff with shadow
Border:              #e5e7eb   (slightly warmer than slate-200)

Text primary:        #0f172a
Text secondary:      #475569
Text muted:          #94a3b8

Success:             #16a34a
Warning:             #f59e0b
Error:               #dc2626
```

### Modernization Guidelines

The current UI feels dated per the client. Apply these changes:

1. **Typography upgrade**: import Inter from Google Fonts via `next/font/google` in `app/layout.tsx`. Apply as the default font. Use font weights 400, 500, 600, 700. Remove any other font families.

2. **Type scale**: bump primary stat numbers from text-4xl to text-5xl. Section headings from text-lg to text-xl. Add tighter letter-spacing (`tracking-tight`) on headings and big numbers.

3. **Generous whitespace**: increase card padding from p-6 to p-8 on desktop (p-6 on mobile). Increase vertical gap between sections from gap-6 to gap-8.

4. **Softer shadows**: replace `shadow-sm` with a custom subtle shadow. Add to Tailwind config:
```
   boxShadow: {
     'card': '0 1px 3px 0 rgb(15 42 71 / 0.04), 0 1px 2px -1px rgb(15 42 71 / 0.04)',
     'card-hover': '0 4px 12px -2px rgb(15 42 71 / 0.08)',
   }
```
   Use `shadow-card` on all cards. Add `hover:shadow-card-hover transition-shadow` on interactive cards.

5. **Rounded corners**: use `rounded-2xl` on cards (was rounded-xl). Use `rounded-lg` on buttons and inputs.

6. **Header redesign**: the header should be navy background with white text (not white with navy text). Full-width, sticky top-0, z-50. "UL Scheduler Health Dashboard" in white bold on the left. Logout button on the right, styled as a ghost button with white text and white border (border-white/30, hover bg-white/10).

7. **Status banner redesign**: larger, more prominent. Icon on the left (use a simple SVG checkmark/warning/X), status text as the main heading in white, description on a second line in white/80 opacity. Timestamps stacked on the right with small labels.

8. **Card hierarchy**: section headings should live outside and above cards, not inside them. Pattern:
```
   <section>
     <h2 class="text-xl font-semibold text-navy mb-4">Section Title</h2>
     <div class="card">...content...</div>
   </section>
```

9. **Chart polish**: 
   - Remove the chart's top/right axis lines
   - Use a very subtle grid (stroke #f1f5f9, strokeDasharray="2 2")
   - Tooltip background white with shadow-card and rounded-lg
   - Axis text in slate-500, text-xs
   - Bar chart corner radius: `radius={[4, 4, 0, 0]}` for a subtle rounded top

10. **Footer redesign**: thin navy top border, centered, slate-500 text. "Last updated: [timestamp]" on the left, refresh button on the right. Refresh button should be small, navy outline style, with a subtle spinning icon when refreshing.

11. **Login page**: apply the same navy background and match the updated card treatment.

### Self-Review

After the modernization, do a self-review pass:
- Does the page still render correctly at mobile width (375px)?
- Is the status banner visible and clearly states what state we're in?
- Do both behavior sections have clear "based on N unique teachers" labels?
- Does clicking refresh actually update the "last updated" timestamp?
- Does the INCubator behavior section have real data (not zeros)?
- Any WCAG AA contrast issues?
- Any leftover old colors (slate-gray text that should now be navy)?

Fix anything you find.

## Out of Scope

- No new auth logic
- No new Railway config
- No Supabase schema changes
- Do not add metrics the client did not ask for (skip starting-lesson for entreINC, skip weeks-remaining averages, etc.)
- Do not remove existing metrics

## Done Criteria

- Refresh button actually refreshes data; "last updated" timestamp changes on each load
- `npm run build` output shows the page as Dynamic, not Static
- "Program Reach" section added with three teacher-count cards
- entreINC behavior section label rewritten to make N prominent and unambiguous
- New INCubatoredu behavior section added with teacher count, avg minutes, avg MVP pitch week, MVP distribution chart, starting position chart
- Color palette updated in Tailwind config
- Inter font applied
- Header redesigned with navy background
- Status banner redesigned
- All cards use new shadow and rounded-2xl
- Charts polished
- Login page matches new theme
- `npm run build` passes clean
- Everything committed and pushed to main (Railway auto-deploys)

## Communication Rules

- No em dashes
- Report at these checkpoints: after the refresh bug fix (verify it's actually dynamic), after the new compute functions are written, after the UI modernization, after local build passes
- If `computeIncubatorBehavior` runs into unexpected data shapes (e.g., `mvp_pitch_week` format differs from "Week X"), stop and report — do not silently skip rows
- If the build still shows the page as static after the `force-dynamic` fix, stop and report