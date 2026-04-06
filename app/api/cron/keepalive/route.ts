import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getSupabase } from "@/lib/supabase";
import { setLastKeepalivePing } from "@/lib/health-state";

export async function GET(request: NextRequest) {
  // Allow Railway cron header OR secret query param
  const cronHeader = request.headers.get("x-railway-cron");
  const secretParam = request.nextUrl.searchParams.get("secret");
  const password = process.env.DASHBOARD_PASSWORD;

  const authorized =
    cronHeader === "true" ||
    (password && secretParam === password);

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timestamp = new Date().toISOString();
  const supabase = getSupabase();

  try {
    const { count: teacherCount, error: teacherError } = await supabase
      .from("Teacher Informantion")
      .select("*", { count: "exact", head: true });

    if (teacherError) throw teacherError;

    const { count: entreCount, error: entreError } = await supabase
      .from("EntreINC")
      .select("*", { count: "exact", head: true });

    if (entreError) throw entreError;

    const { count: incubatorCount, error: incubatorError } = await supabase
      .from("Incubator")
      .select("*", { count: "exact", head: true });

    if (incubatorError) throw incubatorError;

    setLastKeepalivePing(timestamp);

    console.log(`[keepalive] ${timestamp} - Teacher Informantion: ${teacherCount}, EntreINC: ${entreCount}, Incubator: ${incubatorCount}`);

    return NextResponse.json({
      ok: true,
      timestamp,
      rowCounts: {
        teacherInformantion: teacherCount,
        entreINC: entreCount,
        incubator: incubatorCount,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[keepalive] ${timestamp} - FAILED: ${message}`);
    return NextResponse.json({ ok: false, error: message, timestamp }, { status: 500 });
  }
}
