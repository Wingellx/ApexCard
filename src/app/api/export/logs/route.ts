import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function esc(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function pct(num: number, den: number): string {
  return den > 0 ? ((num / den) * 100).toFixed(1) : "0.0";
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: logs } = await supabase
    .from("call_logs")
    .select("date, calls_taken, shows, offers_made, offers_taken, cash_collected, commission_earned")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  const rows: string[] = [
    "date,calls_taken,shows,no_shows,offers_made,closed,cash_collected,commission_earned,show_rate,close_rate",
  ];

  for (const r of logs ?? []) {
    const calls      = r.calls_taken  ?? 0;
    const shows      = r.shows        ?? 0;
    const noShows    = calls - shows;
    const offersMade = r.offers_made  ?? 0;
    const closed     = r.offers_taken ?? 0;
    const cash       = Number(r.cash_collected    ?? 0);
    const commission = Number(r.commission_earned ?? 0);

    rows.push([
      esc(r.date),
      calls,
      shows,
      noShows,
      offersMade,
      closed,
      cash.toFixed(2),
      commission.toFixed(2),
      pct(shows, calls),
      pct(closed, shows),
    ].join(","));
  }

  const date = new Date().toISOString().split("T")[0];
  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="apexcard-logs-${date}.csv"`,
    },
  });
}
