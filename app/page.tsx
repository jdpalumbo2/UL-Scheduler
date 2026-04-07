import {
  getAllSubmissions,
  computeUsage,
  computeTeachers,
  computeBehavior,
  getHealthData,
  type UsageData,
  type TeachersData,
  type BehaviorData,
  type HealthData,
} from "@/lib/metrics/queries";
import DailyChart from "@/app/components/DailyChart";
import TopSubmitters from "@/app/components/TopSubmitters";
import RefreshButton from "@/app/components/RefreshButton";
import LogoutButton from "@/app/components/LogoutButton";

// ---- Status banner ----

function StatusBanner({ health }: { health: HealthData }) {
  const bgColor =
    health.status === "green"
      ? "bg-green-500"
      : health.status === "yellow"
      ? "bg-yellow-500"
      : "bg-red-500";

  const message =
    health.status === "green"
      ? "All systems healthy. Supabase is reachable and teachers are actively using the scheduler."
      : health.status === "yellow"
      ? "Supabase is reachable, but no teacher submissions in the last 7 days."
      : "Supabase is unreachable. The scheduling bot may be affected.";

  return (
    <div className={`${bgColor} rounded-xl p-4 text-white`}>
      <p className="font-semibold">{message}</p>
      <p className="text-sm mt-1 opacity-80">
        {health.lastKeepalivePing
          ? `Last keepalive: ${new Date(health.lastKeepalivePing).toLocaleString()}`
          : "No keepalive recorded this session."}
        {health.daysSinceLastSubmission !== null && (
          <span className="ml-3">
            Last submission: {health.daysSinceLastSubmission} day
            {health.daysSinceLastSubmission !== 1 ? "s" : ""} ago
          </span>
        )}
      </p>
    </div>
  );
}

// ---- Usage cards ----

function UsageCard({
  label,
  data,
}: {
  label: string;
  data: { total: number; entreINC: number; incubator: number };
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-2">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-4xl font-bold text-slate-900">{data.total}</p>
      <div className="text-sm text-slate-500 space-y-0.5">
        <p>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-600 mr-1.5" />
          {data.entreINC} entreINCedu
        </p>
        <p>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-600 mr-1.5" />
          {data.incubator} INCubatoredu
        </p>
      </div>
    </div>
  );
}

// ---- Stat card ----

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-1">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

// ---- Progress bar ----

function ProgressBar({
  label,
  count,
  percent,
}: {
  label: string;
  count: number;
  percent: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-500 tabular-nums">
          {count} ({percent}%)
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ---- Dashboard ----

export default async function DashboardPage() {
  let health: HealthData;
  let usage: UsageData | null = null;
  let teachers: TeachersData | null = null;
  let behavior: BehaviorData | null = null;
  let metricsError = false;

  // Fetch health and all submissions in parallel
  try {
    const [healthResult, submissions] = await Promise.all([
      getHealthData(),
      getAllSubmissions(),
    ]);
    health = healthResult;
    usage = computeUsage(submissions);
    teachers = computeTeachers(submissions);
    behavior = computeBehavior(submissions);
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

  const refreshedAt = new Date().toLocaleString();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              UL Scheduler Health
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Uncharted Learning scheduling bot monitor
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Status banner */}
        <StatusBanner health={health} />

        {metricsError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            Could not load metrics. Check that SUPABASE_URL and SUPABASE_SERVICE_KEY are set.
          </div>
        )}

        {/* Usage cards */}
        {usage && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Usage Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UsageCard label="All Time" data={usage.totals.allTime} />
              <UsageCard label="Last 30 Days" data={usage.totals.last30Days} />
              <UsageCard label="Last 7 Days" data={usage.totals.last7Days} />
            </div>
          </section>
        )}

        {/* Daily chart */}
        {usage && (
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Last 30 Days
            </h2>
            <DailyChart data={usage.dailyChart} />
          </section>
        )}

        {/* Teachers section */}
        {teachers && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Teachers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: stat grid + avg */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    label="Unique (All Time)"
                    value={teachers.uniqueAllTime}
                  />
                  <StatCard
                    label="Active (Last 30d)"
                    value={teachers.uniqueLast30Days}
                  />
                  <StatCard
                    label="New (Last 30d)"
                    value={teachers.newLast30Days}
                  />
                  <StatCard
                    label="Returning (Last 30d)"
                    value={teachers.returningLast30Days}
                  />
                </div>
                <div className="bg-white rounded-xl shadow-sm px-5 py-3 text-sm text-slate-700">
                  Avg submissions per teacher:{" "}
                  <span className="font-semibold">
                    {teachers.avgSubmissionsPerTeacher}
                  </span>
                </div>
              </div>

              {/* Right: top submitters */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Top Submitters
                </h3>
                <TopSubmitters data={teachers.topSubmitters} />
              </div>
            </div>
          </section>
        )}

        {/* Behavior section */}
        {behavior && (
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900">
              entreINCedu Teacher Behavior
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 mb-5">
              Based on most recent submission from {behavior.entreINCTeacherCount} teacher
              {behavior.entreINCTeacherCount !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-col gap-5">
              <p className="text-sm text-slate-700">
                Avg minutes per week:{" "}
                <span className="font-semibold text-slate-900">
                  {behavior.avgMinutesPerWeek}
                </span>
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
          </section>
        )}

        {/* Footer */}
        <footer className="flex items-center justify-between text-xs text-slate-400 pb-4">
          <span>Last refreshed: {refreshedAt}</span>
          <RefreshButton />
        </footer>
      </div>
    </div>
  );
}
