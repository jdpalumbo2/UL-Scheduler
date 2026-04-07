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
  const bg =
    health.status === "green"
      ? "bg-[#16a34a]"
      : health.status === "yellow"
      ? "bg-[#f59e0b]"
      : "bg-[#dc2626]";

  const message =
    health.status === "green"
      ? "All systems healthy. Supabase is reachable and teachers are actively using the scheduler."
      : health.status === "yellow"
      ? "Supabase is reachable, but no teacher submissions in the last 7 days."
      : "Supabase is unreachable. The scheduling bot may be affected.";

  return (
    <div className={`${bg} rounded-xl p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-2`}>
      <p className="font-semibold text-base">{message}</p>
      <p className="text-sm opacity-80 shrink-0">
        {health.lastKeepalivePing
          ? `Last keepalive: ${new Date(health.lastKeepalivePing).toLocaleString()}`
          : "No keepalive recorded this session."}
        {health.daysSinceLastSubmission !== null && (
          <span className="ml-3 md:block md:ml-0">
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
      <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{label}</p>
      <p className="text-4xl font-bold text-[#1e3a5f]">{data.total}</p>
      <div className="text-sm text-slate-600 space-y-0.5 mt-1">
        <p>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#0d9488] mr-1.5 align-middle" />
          {data.entreINC} entreINCedu
        </p>
        <p>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ea580c] mr-1.5 align-middle" />
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
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-4xl font-bold text-[#1e3a5f]">{value}</p>
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
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-500 tabular-nums shrink-0 ml-4">
          {count} ({percent}%)
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0d9488] rounded-full transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

// ---- Section heading ----

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">{children}</h2>
  );
}

// ---- Dashboard ----

export default async function DashboardPage() {
  let health: HealthData;
  let usage: UsageData | null = null;
  let teachers: TeachersData | null = null;
  let behavior: BehaviorData | null = null;
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
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-[#1e3a5f]">
              UL Scheduler Health Dashboard
            </span>
            <span className="hidden md:inline text-sm text-slate-500 ml-3">
              Uncharted Learning scheduling bot monitor
            </span>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Page body */}
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Status banner */}
        <StatusBanner health={health} />

        {metricsError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            Could not load metrics. Check that SUPABASE_URL and SUPABASE_SERVICE_KEY are set.
          </div>
        )}

        {/* Usage section */}
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
          <section className="bg-white rounded-xl shadow-sm p-6">
            <SectionHeading>Last 30 Days</SectionHeading>
            <DailyChart data={usage.dailyChart} />
          </section>
        )}

        {/* Teachers section */}
        {teachers && (
          <section>
            <SectionHeading>Teachers</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: stat grid + avg */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Unique All Time" value={teachers.uniqueAllTime} />
                  <StatCard label="Active Last 30d" value={teachers.uniqueLast30Days} />
                  <StatCard label="New Last 30d" value={teachers.newLast30Days} />
                  <StatCard label="Returning Last 30d" value={teachers.returningLast30Days} />
                </div>
                <div className="bg-white rounded-xl shadow-sm px-5 py-3 text-sm text-slate-600">
                  Avg submissions per teacher:{" "}
                  <span className="font-semibold text-[#1e3a5f]">
                    {teachers.avgSubmissionsPerTeacher}
                  </span>
                </div>
              </div>

              {/* Right: top submitters */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-[#1e3a5f] mb-3">
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
            <SectionHeading>entreINCedu Teacher Behavior</SectionHeading>
            <p className="text-sm text-slate-500 -mt-2 mb-5">
              Based on most recent submission from {behavior.entreINCTeacherCount} teacher
              {behavior.entreINCTeacherCount !== 1 ? "s" : ""}
            </p>
            <div className="flex flex-col gap-5">
              <p className="text-sm text-slate-600">
                Avg minutes per week:{" "}
                <span className="font-bold text-[#1e3a5f]">
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
        <footer className="flex items-center justify-center gap-4 text-xs text-slate-500 pb-4">
          <span>Last refreshed: {refreshedAt}</span>
          <RefreshButton />
        </footer>
      </div>
    </div>
  );
}
