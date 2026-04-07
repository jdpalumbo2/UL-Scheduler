import { NextResponse } from "next/server";
import { getAllSubmissions, computeTeachers } from "@/lib/metrics/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const submissions = await getAllSubmissions();
    return NextResponse.json(computeTeachers(submissions));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[metrics/teachers]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
