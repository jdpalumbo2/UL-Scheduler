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

  for (const row of submissions) {
    const email = normalizeEmail(row.teacher_email);
    if (!email) continue;

    allEmails.add(email);
    countByEmail.set(email, (countByEmail.get(email) ?? 0) + 1);

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

  return {
    uniqueAllTime: allEmails.size,
    uniqueLast30Days: last30Emails.size,
    newLast30Days: newLast30,
    returningLast30Days: returningLast30,
    avgSubmissionsPerTeacher: avgSubmissions,
    topSubmitters,
  };
}

export function computeBehavior(submissions: Submission[]): BehaviorData {
  const CERT_INTUIT = "Intuit Design for Delight Innovator Certification";
  const CERT_PMI = "PMI Project Management Ready\u00AE Certification";
  const CERT_ESB = "Entrepreneurship and Small Business (ESBv2)";

  // Most recent entreINC submission per teacher (submissions already sorted desc)
  const seenEmails = new Set<string>();
  const latestEntreINC: Submission[] = [];

  for (const row of submissions) {
    if (normalizeProgram(row.program_selection) !== "entreINC") continue;
    const email = normalizeEmail(row.teacher_email);
    if (!email || seenEmails.has(email)) continue;
    seenEmails.add(email);
    latestEntreINC.push(row);
  }

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
