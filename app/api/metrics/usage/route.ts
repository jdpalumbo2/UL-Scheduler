import { NextResponse } from "next/server";
import { getAllSubmissions, computeUsage } from "@/lib/metrics/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const submissions = await getAllSubmissions();
    return NextResponse.json(computeUsage(submissions));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[metrics/usage]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
