import { NextRequest, NextResponse } from "next/server";
import { processTierMovement } from "@/lib/community-rankings";

// Called by Vercel cron (or manually) at month-end.
// Protect with CRON_SECRET env var.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const month: string | undefined = body.month; // optional override, e.g. "2026-04-01"

  try {
    const result = await processTierMovement(month);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[process-tiers]", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
