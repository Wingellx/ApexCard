import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: logs } = await supabase
    .from("call_logs")
    .select("calls_taken, shows, offers_made, offers_taken, cash_collected, commission_earned")
    .eq("user_id", user.id);

  const rows = logs ?? [];

  const t = rows.reduce(
    (a, r) => ({
      calls:       a.calls       + (r.calls_taken  ?? 0),
      shows:       a.shows       + (r.shows         ?? 0),
      offersMade:  a.offersMade  + (r.offers_made   ?? 0),
      offersTaken: a.offersTaken + (r.offers_taken  ?? 0),
      cash:        a.cash        + Number(r.cash_collected    ?? 0),
      commission:  a.commission  + Number(r.commission_earned ?? 0),
    }),
    { calls: 0, shows: 0, offersMade: 0, offersTaken: 0, cash: 0, commission: 0 }
  );

  const noShows      = t.calls - t.shows;
  const showRate     = t.calls        > 0 ? ((t.shows       / t.calls)       * 100).toFixed(1) : "0.0";
  const closeRate    = t.shows        > 0 ? ((t.offersTaken / t.shows)       * 100).toFixed(1) : "0.0";
  const cashPerClose = t.offersTaken  > 0 ? (t.cash / t.offersTaken).toFixed(2)                : "0.00";
  const bestDay      = rows.length > 0
    ? Math.max(...rows.map(r => Number(r.cash_collected ?? 0))).toFixed(2)
    : "0.00";
  const daysLogged   = rows.length;

  const metrics: [string, string | number][] = [
    ["Metric", "Value"],
    ["Total Days Logged",              daysLogged],
    ["Lifetime Calls Taken",           t.calls],
    ["Lifetime Shows",                 t.shows],
    ["Lifetime No Shows",              noShows],
    ["Lifetime Offers Made",           t.offersMade],
    ["Lifetime Offers Closed",         t.offersTaken],
    ["Lifetime Cash Collected",        t.cash.toFixed(2)],
    ["Lifetime Commission Earned",     t.commission.toFixed(2)],
    ["Average Show Rate (%)",          showRate],
    ["Average Close Rate (%)",         closeRate],
    ["Average Cash Per Close",         cashPerClose],
    ["Best Single Day (Cash)",         bestDay],
  ];

  const csv = metrics.map(([k, v]) => `${k},${v}`).join("\n");

  const date = new Date().toISOString().split("T")[0];
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="apexcard-stats-${date}.csv"`,
    },
  });
}
