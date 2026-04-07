# Data Shape Verification

## Goal

Before building metrics queries, verify the actual shape of fields in the `Teacher Informantion` Supabase table. The n8n workflow hints at expected types, but production data may have drifted. Five minutes here saves debugging later.

## Task

Create a one-off script at `scripts/inspect-data.ts` that:

1. Connects to Supabase using the existing `lib/supabase.ts` client
2. Fetches 5 sample rows from `Teacher Informantion` for each program: 5 entreINCedu rows and 5 InCubatoredu rows (case-insensitive match on `program_selection`)
3. Also fetches the total row count
4. Also fetches the count of distinct lowercased emails
5. Prints results to console in a readable format

For each sample row, print the value AND the JavaScript type of these fields specifically:
- `teacher_email`
- `program_selection`
- `submission_date`
- `is_latest`
- `avg_minutes_per_week_in_class`
- `weeks_remaining`
- `certifications_selected`
- `modules_to_skip`
- `modules_completed`
- `include_course_connections`
- `mvp_pitch_week`

For array-like fields (`certifications_selected`, `modules_to_skip`, `modules_completed`), explicitly check and print:
- `Array.isArray(value)` result
- If it's a string, attempt `JSON.parse` and report whether that succeeds
- The length if it's an array, or the raw value if not

## How to Run

Add an npm script `"inspect": "tsx scripts/inspect-data.ts"` to package.json. Install `tsx` as a dev dependency if not already present.

User will run `npm run inspect` and paste the output back.

## Out of Scope

- Do not modify any existing files beyond `package.json`
- Do not build metrics routes
- Do not modify the database
- Read-only inspection only

## Done Criteria

- Script runs successfully via `npm run inspect`
- Output clearly shows field types and array handling for both programs
- Total row count and distinct lowercased email count printed