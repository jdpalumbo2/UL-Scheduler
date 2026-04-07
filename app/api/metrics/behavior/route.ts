import { NextResponse } from "next/server";
import { getAllSubmissions, computeBehavior } from "@/lib/metrics/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const submissions = await getAllSubmissions();
    return NextResponse.json(computeBehavior(submissions));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[metrics/behavior]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
