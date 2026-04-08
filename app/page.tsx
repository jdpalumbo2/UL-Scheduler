export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  getAllSubmissions,
  computeUsage,
  computeTeachers,
  computeBehavior,
  computeIncubatorBehavior,
  getHealthData,
  type UsageData,
  type TeachersData,
  type BehaviorData,
  type IncubatorBehaviorData,
  type HealthData,
} from "@/lib/metrics/queries";
import DailyChart from "@/app/components/DailyChart";
import TopSubmitters from "@/app/components/TopSubmitters";
import RefreshButton from "@/app/components/RefreshButton";
import LogoutButton from "@/app/components/LogoutButton";
import { MvpPitchChart, StartingPositionChart } from "@/app/components/IncubatorCharts";

// ---- Icon helpers ----

function CheckIcon() {
  return (
    <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ---- Status banner ----

function StatusBanner({ health }: { health: HealthData }) {
  const bg =
    health.status === "green"
      ? "bg-success"
      : health.status === "yellow"
      ? "bg-warning"
      : "bg-error";

  const icon =
    health.status === "green" ? <CheckIcon /> :
    health.status === "yellow" ? <WarningIcon /> :
    <ErrorIcon />;

  const title =
    health.status === "green" ? "All systems healthy" :
    health.status === "yellow" ? "No recent activity" :
    "Supabase unreachable";

  const description =
    health.status === "green"
      ? "Supabase is reachable and teachers are actively using the scheduler."
      : health.status === "yellow"
      ? "Supabase is reachable, but no teacher submissions in the last 7 days."
      : "Could not connect to Supabase. The scheduling bot may be affected.";

  const keepaliveLabel = health.lastKeepalivePing
    ? new Date(health.lastKeepalivePing).toLocaleString("en-US", {
        timeZone: "America/Chicago",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "Not recorded this session";

  return (
    <div className={`${bg} rounded-2xl p-6 text-white`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon}
          <div>
            <p className="font-bold text-lg tracking-tight">{title}</p>
            <p className="text-sm opacity-80 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="md:text-right text-sm opacity-80 space-y-1 shrink-0">
          <p>
            <span className="font-medium opacity-60 text-xs uppercase tracking-wide block">Last keepalive</span>
            {keepaliveLabel}
          </p>
          {health.daysSinceLastSubmission !== null && (
            <p>
              <span className="font-medium opacity-60 text-xs uppercase tracking-wide block">Last submission</span>
              {health.daysSinceLastSubmission} day{health.daysSinceLastSubmission !== 1 ? "s" : ""} ago
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Shared card wrapper ----

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-card p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

// ---- Stat card ----

function StatCard({
  label,
  value,
  footnote,
}: {
  label: string;
  value: string | number;
  footnote?: string;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-5xl font-bold tracking-tight text-navy">{value}</p>
      {footnote && <p className="text-xs text-slate-400 mt-1">{footnote}</p>}
    </Card>
  );
}

// ---- Usage card ----

function UsageCard({
  label,
  data,
}: {
  label: string;
  data: { total: number; entreINC: number; incubator: number };
}) {
  return (
    <Card className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-5xl font-bold tracking-tight text-navy">{data.total}</p>
      <div className="text-sm text-slate-500 space-y-0.5 mt-1">
        <p>
          <span className="inline-block w-2 h-2 rounded-full bg-brand-teal mr-2 align-middle" />
          {data.entreINC} entreINCedu
        </p>
        <p>
          <span className="inline-block w-2 h-2 rounded-full bg-brand-orange mr-2 align-middle" />
          {data.incubator} INCubatoredu
        </p>
      </div>
    </Card>
  );
}

// ---- Progress bar ----

function ProgressBar({ label, count, percent }: { label: string; count: number; percent: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-500 tabular-nums shrink-0 ml-4">
          {count} ({percent}%)
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-teal rounded-full transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ---- Section heading ----

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-tight text-navy mb-4">{children}</h2>
  );
}

// ---- Dashboard ----

export default async function DashboardPage() {
  let health: HealthData;
  let usage: UsageData | null = null;
  let teachers: TeachersData | null = null;
  let behavior: BehaviorData | null = null;
  let incBehavior: IncubatorBehaviorData | null = null;
  let metricsError = false;

  try {
    const [healthResult, submissions] = await Promise.all([
      getHealthData(),
      getAllSubmissions(),
    ]);
    health = healthResult;
    usage = computeUsage(submissions);
    teachers = computeTeachers(submissions);
    behavior = computeBehavior(submissions);
    incBehavior = computeIncubatorBehavior(submissions);
  } catch (err) {
    console.error("[dashboard] Failed to load data:", err);
    health = {
      status: "red",
      supabaseReachable: false,
      lastKeepalivePing: null,
      lastTeacherSubmission: null,
      daysSinceLastSubmission: null,
    };
    metricsError = true;
  }

  const refreshedAt = new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky navy header */}
      <header className="sticky top-0 z-50 bg-navy shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-base font-bold tracking-tight text-white">
            UL Scheduler Health Dashboard
          </span>
          <LogoutButton />
        </div>
      </header>

      {/* Page body */}
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Status banner */}
        <StatusBanner health={health} />

        {metricsError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">
            Could not load metrics. Check that SUPABASE_URL and SUPABASE_SERVICE_KEY are set.
          </div>
        )}

        {/* Program Reach */}
        {teachers && (
          <section>
            <SectionHeading>Program Reach</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="entreINCedu Teachers"
                value={teachers.programReach.entreINCTeachers}
              />
              <StatCard
                label="INCubatoredu Teachers"
                value={teachers.programReach.incubatorTeachers}
              />
              <StatCard
                label="Teachers Running Both"
                value={teachers.programReach.bothPrograms}
                footnote="Also counted in the totals above."
              />
            </div>
          </section>
        )}

        {/* Usage Overview */}
        {usage && (
          <section>
            <SectionHeading>Usage Overview</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UsageCard label="All Time" data={usage.totals.allTime} />
              <UsageCard label="Last 30 Days" data={usage.totals.last30Days} />
              <UsageCard label="Last 7 Days" data={usage.totals.last7Days} />
            </div>
          </section>
        )}

        {/* Daily chart */}
        {usage && (
          <section>
            <SectionHeading>Last 30 Days</SectionHeading>
            <Card>
              <DailyChart data={usage.dailyChart} />
            </Card>
          </section>
        )}

        {/* Teachers section */}
        {teachers && (
          <section>
            <SectionHeading>Teachers</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Unique All Time" value={teachers.uniqueAllTime} />
                  <StatCard label="Active Last 30d" value={teachers.uniqueLast30Days} />
                  <StatCard label="New Last 30d" value={teachers.newLast30Days} />
                  <StatCard label="Returning Last 30d" value={teachers.returningLast30Days} />
                </div>
                <Card className="py-4 md:py-4 text-sm text-slate-600">
                  Avg submissions per teacher:{" "}
                  <span className="font-bold text-navy">{teachers.avgSubmissionsPerTeacher}</span>
                </Card>
              </div>
              <Card>
                <h3 className="text-base font-semibold tracking-tight text-navy mb-3">
                  Top Submitters
                </h3>
                <TopSubmitters data={teachers.topSubmitters} />
              </Card>
            </div>
          </section>
        )}

        {/* entreINCedu Behavior */}
        {behavior && (
          <section>
            <SectionHeading>entreINCedu Teacher Behavior</SectionHeading>
            <Card>
              <div className="mb-5">
                <p className="text-3xl font-bold tracking-tight text-navy">
                  {behavior.entreINCTeacherCount}{" "}
                  <span className="text-lg font-semibold text-slate-500">unique teachers</span>
                </p>
                <p className="text-sm text-slate-400 mt-0.5">
                  Showing each teacher&apos;s most recent submission
                </p>
              </div>
              <div className="flex flex-col gap-5">
                <p className="text-sm text-slate-600">
                  Avg minutes per week:{" "}
                  <span className="font-bold text-navy">{behavior.avgMinutesPerWeek}</span>
                </p>
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Certifications
                  </p>
                  <ProgressBar
                    label="Intuit Design for Delight Innovator"
                    count={behavior.certifications.intuit.count}
                    percent={behavior.certifications.intuit.percent}
                  />
                  <ProgressBar
                    label="PMI Project Management Ready"
                    count={behavior.certifications.pmi.count}
                    percent={behavior.certifications.pmi.percent}
                  />
                  <ProgressBar
                    label="Entrepreneurship and Small Business (ESBv2)"
                    count={behavior.certifications.esb.count}
                    percent={behavior.certifications.esb.percent}
                  />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">
                    Course Connections
                  </p>
                  <ProgressBar
                    label="Opted in to Course Connections"
                    count={behavior.courseConnections.count}
                    percent={behavior.courseConnections.percent}
                  />
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* INCubatoredu Behavior */}
        {incBehavior && (
          <section>
            <SectionHeading>INCubatoredu Teacher Behavior</SectionHeading>
            <div className="flex flex-col gap-4">
              {/* Top stats row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Unique Teachers</p>
                  <p className="text-5xl font-bold tracking-tight text-navy">{incBehavior.teacherCount}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Most recent submission each</p>
                </Card>
                <Card className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Min / Week</p>
                  <p className="text-5xl font-bold tracking-tight text-navy">{incBehavior.avgMinutesPerWeek}</p>
                </Card>
                <Card className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg MVP Pitch</p>
                  <p className="text-5xl font-bold tracking-tight text-navy">
                    {incBehavior.avgMvpPitchWeek !== null
                      ? `Wk ${incBehavior.avgMvpPitchWeek}`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Across {incBehavior.mvpPitchTeacherCount} teacher{incBehavior.mvpPitchTeacherCount !== 1 ? "s" : ""} with upcoming pitch
                  </p>
                </Card>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <h3 className="text-sm font-semibold text-navy mb-1">MVP Pitch Week Distribution</h3>
                  <p className="text-xs text-slate-400 mb-4">When teachers schedule their MVP pitch</p>
                  <MvpPitchChart data={incBehavior.mvpPitchDistribution} />
                </Card>
                <Card>
                  <h3 className="text-sm font-semibold text-navy mb-1">Where Teachers Start</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    First submission curriculum position &mdash; INCubatoredu has 8 units
                  </p>
                  <StartingPositionChart data={incBehavior.startingPositionDistribution} />
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-navy/10 pt-4 flex items-center justify-between text-xs text-slate-500 pb-6">
          <span>Last updated: {refreshedAt}</span>
          <RefreshButton />
        </footer>
      </div>
    </div>
  );
}
