import { getSupabase } from "@/lib/supabase";
import { getLastKeepalivePing } from "@/lib/health-state";
import { differenceInDays, subDays } from "date-fns";

const CT_TZ = "America/Chicago";

// Returns a "yyyy-MM-dd" string in US Central time for any Date value
function toCtDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// ---- Types ----

export type Submission = {
  teacher_email: string | null;
  program_selection: string | null;
  submission_date: string | null;
  is_latest: boolean | null;
  avg_minutes_per_week_in_class: string | number | null;
  weeks_remaining: string | number | null;
  certifications_selected: string | null;
  modules_to_skip: string | null;
  modules_completed: string | null;
  include_course_connections: boolean | null;
  mvp_pitch_week: string | null;
  current_curriculum_position: string | null;
};

export type UsageData = {
  totals: {
    allTime: { total: number; entreINC: number; incubator: number };
    last30Days: { total: number; entreINC: number; incubator: number };
    last7Days: { total: number; entreINC: number; incubator: number };
  };
  dailyChart: { date: string; entreINC: number; incubator: number }[];
};

export type TeachersData = {
  uniqueAllTime: number;
  uniqueLast30Days: number;
  newLast30Days: number;
  returningLast30Days: number;
  avgSubmissionsPerTeacher: number;
  topSubmitters: { email: string; count: number }[];
  programReach: {
    entreINCTeachers: number;
    incubatorTeachers: number;
    bothPrograms: number;
  };
};

export type BehaviorData = {
  entreINCTeacherCount: number;
  avgMinutesPerWeek: number;
  certifications: {
    intuit: { count: number; percent: number };
    pmi: { count: number; percent: number };
    esb: { count: number; percent: number };
  };
  courseConnections: { count: number; percent: number };
};

export type IncubatorBehaviorData = {
  teacherCount: number;
  avgMinutesPerWeek: number;
  avgMvpPitchWeek: number | null;
  mvpPitchTeacherCount: number;
  mvpPitchDistribution: Array<{ bucket: string; count: number }>;
  startingPositionDistribution: Array<{ unit: string; count: number }>;
};

export type HealthData = {
  status: "green" | "yellow" | "red";
  supabaseReachable: boolean;
  lastKeepalivePing: string | null;
  lastTeacherSubmission: string | null;
  daysSinceLastSubmission: number | null;
};

// ---- Normalization helpers ----

export function normalizeEmail(email: string | null): string {
  return (email ?? "").toLowerCase().trim();
}

export function normalizeProgram(
  program: string | null
): "entreINC" | "incubator" | "unknown" {
  const p = (program ?? "").toLowerCase();
  if (p === "entreincedu") return "entreINC";
  if (p === "incubatoredu") return "incubator";
  return "unknown";
}

export function parseCertifications(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s !== "None");
}

export function parseIntSafe(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? null : n;
}

// ---- Shared helper: most-recent submission per teacher for a given program ----

function latestPerTeacher(
  submissions: Submission[],
  program: "entreINC" | "incubator"
): Submission[] {
  // submissions is already sorted desc by submission_date
  const seen = new Set<string>();
  const result: Submission[] = [];
  for (const row of submissions) {
    if (normalizeProgram(row.program_selection) !== program) continue;
    const email = normalizeEmail(row.teacher_email);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    result.push(row);
  }
  return result;
}

// ---- Data fetching ----

const SELECTED_COLUMNS = [
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
  "current_curriculum_position",
].join(", ");

export async function getAllSubmissions(): Promise<Submission[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("Teacher Informantion")
    .select(SELECTED_COLUMNS)
    .order("submission_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Submission[];
}

// ---- Metric computations ----

export function computeUsage(submissions: Submission[]): UsageData {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sevenDaysAgo = subDays(now, 7);

  let allTimeEntreINC = 0,
    allTimeIncubator = 0;
  let last30EntreINC = 0,
    last30Incubator = 0;
  let last7EntreINC = 0,
    last7Incubator = 0;

  // Pre-fill last 30 days
  const dailyMap = new Map<string, { entreINC: number; incubator: number }>();
  for (let i = 29; i >= 0; i--) {
    dailyMap.set(toCtDateKey(subDays(now, i)), {
      entreINC: 0,
      incubator: 0,
    });
  }

  for (const row of submissions) {
    const program = normalizeProgram(row.program_selection);
    if (program === "unknown") continue;

    if (program === "entreINC") allTimeEntreINC++;
    else allTimeIncubator++;

    const date = row.submission_date ? new Date(row.submission_date) : null;
    if (!date) continue;

    if (date >= thirtyDaysAgo) {
      if (program === "entreINC") last30EntreINC++;
      else last30Incubator++;
    }
    if (date >= sevenDaysAgo) {
      if (program === "entreINC") last7EntreINC++;
      else last7Incubator++;
    }

    const dateKey = toCtDateKey(date);
    const entry = dailyMap.get(dateKey);
    if (entry) {
      if (program === "entreINC") entry.entreINC++;
      else entry.incubator++;
    }
  }

  return {
    totals: {
      allTime: {
        total: allTimeEntreINC + allTimeIncubator,
        entreINC: allTimeEntreINC,
        incubator: allTimeIncubator,
      },
      last30Days: {
        total: last30EntreINC + last30Incubator,
        entreINC: last30EntreINC,
        incubator: last30Incubator,
      },
      last7Days: {
        total: last7EntreINC + last7Incubator,
        entreINC: last7EntreINC,
        incubator: last7Incubator,
      },
    },
    dailyChart: Array.from(dailyMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    })),
  };
}

export function computeTeachers(submissions: Submission[]): TeachersData {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const allEmails = new Set<string>();
  const last30Emails = new Set<string>();
  const firstSubmissionByEmail = new Map<string, Date>();
  const countByEmail = new Map<string, number>();
  const emailPrograms = new Map<string, Set<string>>();

  for (const row of submissions) {
    const email = normalizeEmail(row.teacher_email);
    if (!email) continue;

    allEmails.add(email);
    countByEmail.set(email, (countByEmail.get(email) ?? 0) + 1);

    const program = normalizeProgram(row.program_selection);
    if (program !== "unknown") {
      if (!emailPrograms.has(email)) emailPrograms.set(email, new Set());
      emailPrograms.get(email)!.add(program);
    }

    const date = row.submission_date ? new Date(row.submission_date) : null;
    if (!date) continue;

    if (date >= thirtyDaysAgo) last30Emails.add(email);

    const existing = firstSubmissionByEmail.get(email);
    if (!existing || date < existing) {
      firstSubmissionByEmail.set(email, date);
    }
  }

  let newLast30 = 0,
    returningLast30 = 0;
  Array.from(last30Emails).forEach((email) => {
    const firstDate = firstSubmissionByEmail.get(email);
    if (!firstDate) return;
    if (firstDate >= thirtyDaysAgo) newLast30++;
    else returningLast30++;
  });

  const topSubmitters = Array.from(countByEmail.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([email, count]) => ({ email, count }));

  const avgSubmissions =
    allEmails.size > 0
      ? Math.round((submissions.length / allEmails.size) * 10) / 10
      : 0;

  let entreINCTeachers = 0,
    incubatorTeachers = 0,
    bothPrograms = 0;
  emailPrograms.forEach((programs) => {
    const hasEntreINC = programs.has("entreINC");
    const hasIncubator = programs.has("incubator");
    if (hasEntreINC) entreINCTeachers++;
    if (hasIncubator) incubatorTeachers++;
    if (hasEntreINC && hasIncubator) bothPrograms++;
  });

  return {
    uniqueAllTime: allEmails.size,
    uniqueLast30Days: last30Emails.size,
    newLast30Days: newLast30,
    returningLast30Days: returningLast30,
    avgSubmissionsPerTeacher: avgSubmissions,
    topSubmitters,
    programReach: { entreINCTeachers, incubatorTeachers, bothPrograms },
  };
}

export function computeBehavior(submissions: Submission[]): BehaviorData {
  const CERT_INTUIT = "Intuit Design for Delight Innovator Certification";
  const CERT_PMI = "PMI Project Management Ready\u00AE Certification";
  const CERT_ESB = "Entrepreneurship and Small Business (ESBv2)";

  const latestEntreINC = latestPerTeacher(submissions, "entreINC");
  const teacherCount = latestEntreINC.length;
  let minutesTotal = 0,
    minutesCount = 0;
  let intuitCount = 0,
    pmiCount = 0,
    esbCount = 0;
  let courseConnectionsCount = 0;

  for (const row of latestEntreINC) {
    const mins = parseIntSafe(row.avg_minutes_per_week_in_class);
    if (mins !== null) {
      minutesTotal += mins;
      minutesCount++;
    }

    const certs = parseCertifications(row.certifications_selected);
    if (certs.includes(CERT_INTUIT)) intuitCount++;
    if (certs.includes(CERT_PMI)) pmiCount++;
    if (certs.includes(CERT_ESB)) esbCount++;

    if (row.include_course_connections === true) courseConnectionsCount++;
  }

  const pct = (n: number) =>
    teacherCount > 0 ? Math.round((n / teacherCount) * 1000) / 10 : 0;

  return {
    entreINCTeacherCount: teacherCount,
    avgMinutesPerWeek:
      minutesCount > 0 ? Math.round(minutesTotal / minutesCount) : 0,
    certifications: {
      intuit: { count: intuitCount, percent: pct(intuitCount) },
      pmi: { count: pmiCount, percent: pct(pmiCount) },
      esb: { count: esbCount, percent: pct(esbCount) },
    },
    courseConnections: {
      count: courseConnectionsCount,
      percent: pct(courseConnectionsCount),
    },
  };
}

export function computeIncubatorBehavior(
  submissions: Submission[]
): IncubatorBehaviorData {
  const MVP_WEEK_RE = /Week\s+(\d+)/i;

  // Most recent INCubatoredu submission per teacher
  const latestINC = latestPerTeacher(submissions, "incubator");
  const teacherCount = latestINC.length;

  let minutesTotal = 0,
    minutesCount = 0;
  let mvpTotal = 0,
    mvpCount = 0;

  // MVP pitch distribution buckets
  const mvpBuckets: Record<string, number> = {
    "Weeks 1-10": 0,
    "Weeks 11-20": 0,
    "Weeks 21-30": 0,
    "Weeks 31+": 0,
    "Already occurred": 0,
  };

  for (const row of latestINC) {
    const mins = parseIntSafe(row.avg_minutes_per_week_in_class);
    if (mins !== null) {
      minutesTotal += mins;
      minutesCount++;
    }

    const mvpRaw = row.mvp_pitch_week;
    if (mvpRaw) {
      const match = MVP_WEEK_RE.exec(mvpRaw);
      if (match) {
        const wk = parseInt(match[1], 10);
        mvpTotal += wk;
        mvpCount++;
        if (wk <= 10) mvpBuckets["Weeks 1-10"]++;
        else if (wk <= 20) mvpBuckets["Weeks 11-20"]++;
        else if (wk <= 30) mvpBuckets["Weeks 21-30"]++;
        else mvpBuckets["Weeks 31+"]++;
      } else if (mvpRaw.toLowerCase().includes("already")) {
        mvpBuckets["Already occurred"]++;
      }
      // null / empty / unrecognized format: skip silently
    }
  }

  // Starting curriculum position: use each teacher's FIRST submission
  // Build a map email -> earliest submission (INCubatoredu only)
  const firstByEmail = new Map<string, Submission>();
  // submissions is desc by date, so iterate in reverse for earliest
  for (let i = submissions.length - 1; i >= 0; i--) {
    const row = submissions[i];
    if (normalizeProgram(row.program_selection) !== "incubator") continue;
    const email = normalizeEmail(row.teacher_email);
    if (!email) continue;
    firstByEmail.set(email, row);
  }

  const unitCounts: Record<string, number> = {};
  for (let u = 1; u <= 8; u++) unitCounts[`Unit ${u}`] = 0;

  firstByEmail.forEach((row) => {
    const pos = row.current_curriculum_position;
    if (!pos) return;
    const unit = parseInt(pos.split(".")[0], 10);
    if (unit >= 1 && unit <= 8) {
      unitCounts[`Unit ${unit}`]++;
    }
  });

  const startingPositionDistribution = Object.entries(unitCounts).map(
    ([unit, count]) => ({ unit, count })
  );

  const mvpPitchDistribution = Object.entries(mvpBuckets).map(
    ([bucket, count]) => ({ bucket, count })
  );

  return {
    teacherCount,
    avgMinutesPerWeek:
      minutesCount > 0 ? Math.round(minutesTotal / minutesCount) : 0,
    avgMvpPitchWeek: mvpCount > 0 ? Math.round(mvpTotal / mvpCount) : null,
    mvpPitchTeacherCount: mvpCount,
    mvpPitchDistribution,
    startingPositionDistribution,
  };
}

export async function getHealthData(): Promise<HealthData> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("Teacher Informantion")
      .select("submission_date")
      .order("submission_date", { ascending: false })
      .limit(1);

    if (error) throw error;

    const lastSubmission = data?.[0]?.submission_date ?? null;
    const daysSince = lastSubmission
      ? differenceInDays(new Date(), new Date(lastSubmission))
      : null;
    const status: HealthData["status"] =
      daysSince === null || daysSince > 7 ? "yellow" : "green";

    return {
      status,
      supabaseReachable: true,
      lastKeepalivePing: getLastKeepalivePing(),
      lastTeacherSubmission: lastSubmission,
      daysSinceLastSubmission: daysSince,
    };
  } catch {
    return {
      status: "red",
      supabaseReachable: false,
      lastKeepalivePing: getLastKeepalivePing(),
      lastTeacherSubmission: null,
      daysSinceLastSubmission: null,
    };
  }
}
