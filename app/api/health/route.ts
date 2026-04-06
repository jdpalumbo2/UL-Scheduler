import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getSupabase } from "@/lib/supabase";
import { getLastKeepalivePing } from "@/lib/health-state";
import { differenceInDays } from "date-fns";

export async function GET() {
  const timestamp = new Date().toISOString();
  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from("Teacher Informantion")
      .select("submission_date")
      .order("submission_date", { ascending: false })
      .limit(1);

    if (error) throw error;

    const lastSubmission = data?.[0]?.submission_date ?? null;
    const daysSinceLastSubmission = lastSubmission
      ? differenceInDays(new Date(), new Date(lastSubmission))
      : null;

    const status =
      daysSinceLastSubmission === null || daysSinceLastSubmission > 7
        ? "yellow"
        : "green";

    return NextResponse.json({
      status,
      supabaseReachable: true,
      lastKeepalivePing: getLastKeepalivePing(),
      lastTeacherSubmission: lastSubmission,
      daysSinceLastSubmission,
      timestamp,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[health] Supabase unreachable: ${message}`);

    return NextResponse.json({
      status: "red",
      supabaseReachable: false,
      lastKeepalivePing: getLastKeepalivePing(),
      lastTeacherSubmission: null,
      daysSinceLastSubmission: null,
      timestamp,
    });
  }
}
