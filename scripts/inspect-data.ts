import { getSupabase } from "../lib/supabase";

const ARRAY_FIELDS = ["certifications_selected", "modules_to_skip", "modules_completed"] as const;

const FIELDS = [
  "teacher_email",
  "program_selection",
  "submission_date",
  "is_latest",
  "avg_minutes_per_week_in_class",
  "weeks_remaining",
  "certifications_selected",
  "modules_to_skip",
  "modules_completed",
  "include_course_connections",
  "mvp_pitch_week",
] as const;

type Row = Record<string, unknown>;

function inspectArrayField(name: string, value: unknown) {
  if (Array.isArray(value)) {
    console.log(`    ${name}: [Array, length=${value.length}]`, JSON.stringify(value).slice(0, 120));
  } else if (typeof value === "string") {
    let parsed: unknown;
    let parseable = false;
    try {
      parsed = JSON.parse(value);
      parseable = true;
    } catch {
      // not JSON
    }
    if (parseable && Array.isArray(parsed)) {
      console.log(`    ${name}: [string -> JSON.parse -> Array, length=${(parsed as unknown[]).length}]`, JSON.stringify(parsed).slice(0, 120));
    } else if (parseable) {
      console.log(`    ${name}: [string -> JSON.parse -> ${typeof parsed}]`, String(parsed).slice(0, 80));
    } else {
      console.log(`    ${name}: [string, not JSON-parseable]`, JSON.stringify(value).slice(0, 80));
    }
  } else {
    console.log(`    ${name}: [${typeof value}]`, value === null ? "null" : value === undefined ? "undefined" : String(value));
  }
}

function printRow(row: Row, index: number) {
  console.log(`  --- Row ${index + 1} ---`);
  for (const field of FIELDS) {
    const value = row[field];
    if ((ARRAY_FIELDS as readonly string[]).includes(field)) {
      inspectArrayField(field, value);
    } else {
      const display = value === null ? "null" : value === undefined ? "undefined" : JSON.stringify(value).slice(0, 100);
      console.log(`    ${field}: [${typeof value}] ${display}`);
    }
  }
}

async function main() {
  const supabase = getSupabase();

  // Total row count
  const { count: totalCount, error: countError } = await supabase
    .from("Teacher Informantion")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Failed to get total count:", countError.message);
    process.exit(1);
  }
  console.log(`\nTotal rows in "Teacher Informantion": ${totalCount}`);

  // Distinct email count (lowercased)
  const { data: emailRows, error: emailError } = await supabase
    .from("Teacher Informantion")
    .select("teacher_email");

  if (emailError) {
    console.error("Failed to fetch emails:", emailError.message);
    process.exit(1);
  }
  const distinctEmails = new Set(
    (emailRows ?? []).map((r) => String(r.teacher_email ?? "").toLowerCase().trim())
  );
  console.log(`Distinct lowercased emails: ${distinctEmails.size}\n`);

  // 5 entreINCedu rows
  const { data: entreRows, error: entreError } = await supabase
    .from("Teacher Informantion")
    .select(FIELDS.join(", "))
    .ilike("program_selection", "entreincedu")
    .limit(5);

  if (entreError) {
    console.error("Failed to fetch entreINCedu rows:", entreError.message);
    process.exit(1);
  }

  console.log(`=== entreINCedu sample (${entreRows?.length ?? 0} rows) ===`);
  if (!entreRows || entreRows.length === 0) {
    console.log("  (no rows found)");
  } else {
    for (let i = 0; i < entreRows.length; i++) {
      printRow(entreRows[i] as Row, i);
    }
  }

  // 5 InCubatoredu rows
  const { data: incubatorRows, error: incubatorError } = await supabase
    .from("Teacher Informantion")
    .select(FIELDS.join(", "))
    .ilike("program_selection", "incubatoredu")
    .limit(5);

  if (incubatorError) {
    console.error("Failed to fetch InCubatoredu rows:", incubatorError.message);
    process.exit(1);
  }

  console.log(`\n=== InCubatoredu sample (${incubatorRows?.length ?? 0} rows) ===`);
  if (!incubatorRows || incubatorRows.length === 0) {
    console.log("  (no rows found)");
  } else {
    for (let i = 0; i < incubatorRows.length; i++) {
      printRow(incubatorRows[i] as Row, i);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
