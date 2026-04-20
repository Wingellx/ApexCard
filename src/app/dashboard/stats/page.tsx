import { Award, ExternalLink, ShieldCheck, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAllCallLogs, getProfileFull, computeBestPeriods, weekRangeLabel, monthKeyLabel,
  getDateRangeLogs, thisWeekBounds, lastWeekBounds,
} from "@/lib/queries";
import CopyLinkButton from "@/components/dashboard/CopyLinkButton";
import VerificationForm from "@/components/dashboard/VerificationForm";
import DownloadCardButton from "@/components/dashboard/DownloadCardButton";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => n.toLocaleString();

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[#1e2130] last:border-0">
      <span className="text-sm text-[#6b7280]">{label}</span>
      <div className="text-right">
        <span className="text-sm font-bold text-[#f0f2f8] tabular-nums">{value}</span>
        {sub && <span className="text-xs text-[#6b7280] ml-2">{sub}</span>}
      </div>
    </div>
  );
}

export default async function StatsPage() {
  try {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) console.error("[stats] auth error:", authError);

  let logs: Awaited<ReturnType<typeof getAllCallLogs>> = [];
  let profile: Awaited<ReturnType<typeof getProfileFull>> = null;

  const tw = thisWeekBounds();
  const lw = lastWeekBounds();
  type RawLog = { date: string; calls_taken?: number | null; shows?: number | null; offers_taken?: number | null; cash_collected?: number | string | null; commission_earned?: number | string | null };
  let thisWeekLogs: RawLog[] = [];
  let lastWeekLogs: RawLog[] = [];

  if (user) {
    const [logsResult, profileResult, twResult, lwResult] = await Promise.allSettled([
      getAllCallLogs(user.id),
      getProfileFull(user.id),
      getDateRangeLogs(user.id, tw.start, tw.end),
      getDateRangeLogs(user.id, lw.start, lw.end),
    ]);
    if (logsResult.status === "fulfilled") {
      logs = logsResult.value;
    } else {
      console.error("[stats] getAllCallLogs error:", logsResult.reason);
    }
    if (profileResult.status === "fulfilled") {
      profile = profileResult.value;
    } else {
      console.error("[stats] getProfileFull error:", profileResult.reason);
    }
    if (twResult.status === "fulfilled") thisWeekLogs = twResult.value as RawLog[];
    if (lwResult.status === "fulfilled") lastWeekLogs = lwResult.value as RawLog[];
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = profile?.username
    ? `${appUrl}/card/${profile.username}`
    : `${appUrl}/stats/${user?.id}`;

  // Fetch verification status (admin client — avoids RLS on verify_token columns)
  const admin = createAdminClient();
  const { data: verifyReq, error: verifyError } = user
    ? await admin
        .from("verification_requests")
        .select("manager_name, manager_company, manager_email, status, created_at, verified_at, verification_start_date")
        .eq("user_id", user.id)
        .in("status", ["pending", "verified"])
        .maybeSingle()
    : { data: null, error: null };
  if (verifyError) console.error("[stats] verification_requests error:", verifyError);

  const verificationStatus = (verifyReq?.status ?? "none") as "none" | "pending" | "verified" | "rejected";

  if (logs.length === 0) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px]">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Lifetime Stats</h1>
              <p className="text-sm text-[#6b7280] mt-0.5">Log some calls to start building your stats.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#f0f2f8] border border-[#1e2130] hover:border-[#2a2f45] px-3 py-2 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Preview card
            </a>
            <CopyLinkButton url={publicUrl} />
          </div>
        </div>
      </div>
    );
  }

  const { bestWeek, bestMonth } = computeBestPeriods(logs);

  // Week-over-week helpers
  function aggWeek(rows: RawLog[]) {
    return rows.reduce(
      (a, r) => ({
        calls:       a.calls       + (r.calls_taken  ?? 0),
        offersTaken: a.offersTaken + (r.offers_taken ?? 0),
        shows:       a.shows       + (r.shows        ?? 0),
        cash:        a.cash        + Number(r.cash_collected    ?? 0),
        commission:  a.commission  + Number(r.commission_earned ?? 0),
      }),
      { calls: 0, offersTaken: 0, shows: 0, cash: 0, commission: 0 }
    );
  }
  const twAgg = aggWeek(thisWeekLogs);
  const lwAgg = aggWeek(lastWeekLogs);
  const twCR  = twAgg.shows > 0 ? (twAgg.offersTaken / twAgg.shows) * 100 : 0;
  const lwCR  = lwAgg.shows > 0 ? (lwAgg.offersTaken / lwAgg.shows) * 100 : 0;

  const totals = logs.reduce(
    (a, r) => ({
      calls:       a.calls       + (r.calls_taken       ?? 0),
      shows:       a.shows       + (r.shows             ?? 0),
      offersMade:  a.offersMade  + (r.offers_made       ?? 0),
      offersTaken: a.offersTaken + (r.offers_taken      ?? 0),
      cash:        a.cash        + Number(r.cash_collected    ?? 0),
      commission:  a.commission  + Number(r.commission_earned ?? 0),
    }),
    { calls: 0, shows: 0, offersMade: 0, offersTaken: 0, cash: 0, commission: 0 }
  );

  const showRate     = totals.calls        > 0 ? (totals.shows       / totals.calls)       * 100 : 0;
  const closeRate    = totals.shows        > 0 ? (totals.offersTaken / totals.shows)       * 100 : 0;
  const cashPerClose = totals.offersTaken  > 0 ?  totals.cash        / totals.offersTaken        : 0;
  const bestDay      = Math.max(...logs.map((r) => Number(r.cash_collected ?? 0)));
  const daysLogged   = logs.length;

  return (
    <div className="px-8 py-8 max-w-[900px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Lifetime Stats</h1>
              {verificationStatus === "verified" && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
            <p className="text-sm text-[#6b7280] mt-0.5">Your all-time performance across {daysLogged} logged days.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DownloadCardButton stats={{
            name:           profile?.full_name ?? user?.email?.split("@")[0] ?? "Apex Rep",
            role:           profile?.role ?? null,
            isVerified:     verificationStatus === "verified",
            verifiedByName: verifyReq?.manager_name ?? null,
            verifiedByCompany: verifyReq?.manager_company ?? null,
            cash:        totals.cash,
            commission:  totals.commission,
            calls:       totals.calls,
            offersMade:  totals.offersMade,
            offersTaken: totals.offersTaken,
            shows:       totals.shows,
            showRate,
            closeRate,
            cashPerClose,
            bestDay,
            daysLogged,
          }} />
          <a
            href={publicUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#f0f2f8] border border-[#1e2130] hover:border-[#2a2f45] px-3 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Preview card
          </a>
          <CopyLinkButton url={publicUrl} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Revenue */}
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
          <div className="h-[2px] bg-emerald-500 shadow-[0_2px_14px_2px_rgba(16,185,129,0.22)]" />
          <div className="p-5">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-4">Revenue</p>
          <StatRow label="Lifetime Cash Collected"  value={fmt(totals.cash)} />
          <StatRow label="Lifetime Commission"       value={fmt(totals.commission)} />
          <StatRow label="Average Cash Per Close"    value={fmt(cashPerClose)} />
          <StatRow label="Best Single Day"           value={fmt(bestDay)} />
          </div>
        </div>

        {/* Activity */}
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
          <div className="h-[2px] bg-violet-500 shadow-[0_2px_14px_2px_rgba(139,92,246,0.28)]" />
          <div className="p-5">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-4">Activity</p>
          <StatRow label="Lifetime Calls Taken"  value={fmtNum(totals.calls)} />
          <StatRow label="Lifetime Offers Made"  value={fmtNum(totals.offersMade)} />
          <StatRow label="Lifetime Deals Closed" value={fmtNum(totals.offersTaken)} />
          <StatRow label="Total Days Logged"     value={fmtNum(daysLogged)} />
          </div>
        </div>

        {/* Rates */}
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden md:col-span-2">
          <div className="h-[2px] bg-cyan-500 shadow-[0_2px_14px_2px_rgba(6,182,212,0.22)]" />
          <div className="p-5">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-4">Conversion Rates</p>
          <div className="grid grid-cols-2 gap-0">
            <StatRow label="Average Show Rate"  value={`${showRate.toFixed(1)}%`}  sub={`${totals.shows} of ${totals.calls} calls`} />
            <StatRow label="Average Close Rate" value={`${closeRate.toFixed(1)}%`} sub={`${totals.offersTaken} of ${totals.shows} shows`} />
          </div>
          </div>
        </div>
      </div>

      {/* This Week vs Last Week */}
      {(twAgg.calls > 0 || lwAgg.calls > 0) && (
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden mb-4">
          <div className="h-[2px] bg-violet-500 shadow-[0_2px_14px_2px_rgba(139,92,246,0.28)]" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">This Week vs Last Week</p>
              <span className="text-[11px] text-[#4b5563]">vs {weekRangeLabel(lw.start)}</span>
            </div>
            <p className="text-xs text-[#4b5563] mb-4">{weekRangeLabel(tw.start)}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Calls",      tw: twAgg.calls,       lw: lwAgg.calls,       fmt: (n: number) => n.toLocaleString(), type: "number" as const },
                { label: "Cash",       tw: twAgg.cash,        lw: lwAgg.cash,        fmt: (n: number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n), type: "currency" as const },
                { label: "Close Rate", tw: twCR,              lw: lwCR,              fmt: (n: number) => `${n.toFixed(1)}%`, type: "percent" as const },
                { label: "Commission", tw: twAgg.commission,  lw: lwAgg.commission,  fmt: (n: number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n), type: "currency" as const },
              ].map(({ label, tw: cur, lw: prev, fmt: fmtFn }) => {
                const diff = cur - prev;
                const up   = diff > 0;
                const flat = Math.abs(diff) < 0.01;
                return (
                  <div key={label} className="bg-[#0d0f15] border border-[#1e2130] rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-2">{label}</p>
                    <p className="text-xl font-extrabold tabular-nums text-[#f0f2f8] mb-1">{fmtFn(cur)}</p>
                    {flat
                      ? <span className="inline-flex items-center gap-1 text-xs text-[#6b7280]"><Minus className="w-3 h-3" /> No change</span>
                      : <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}>
                          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {up ? "+" : ""}{fmtFn(Math.abs(diff))} vs last week
                        </span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Records */}
      {(bestWeek || bestMonth) && (
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden mb-4">
          <div className="h-[2px] bg-amber-500 shadow-[0_2px_14px_2px_rgba(245,158,11,0.28)]" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-400" />
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Personal Records</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6">
              {bestWeek && (
                <div>
                  <p className="text-xs text-[#6b7280] mb-2">Best Week Ever</p>
                  <p className="text-2xl font-extrabold text-amber-400 tabular-nums mb-0.5">{fmt(bestWeek.cash)}</p>
                  <p className="text-xs text-[#4b5563] mb-3">{weekRangeLabel(bestWeek.key)}</p>
                  <div className="flex gap-4 text-xs text-[#6b7280]">
                    <span><span className="text-[#9ca3af] font-semibold">{bestWeek.calls}</span> calls</span>
                    <span><span className="text-[#9ca3af] font-semibold">{bestWeek.offersTaken}</span> closes</span>
                    <span><span className="text-[#9ca3af] font-semibold">{fmt(bestWeek.commission)}</span> commission</span>
                  </div>
                </div>
              )}
              {bestMonth && (
                <div className={bestWeek ? "border-t border-[#1e2130] pt-4 md:pt-0 md:border-t-0 md:border-l md:pl-6" : ""}>
                  <p className="text-xs text-[#6b7280] mb-2">Best Month Ever</p>
                  <p className="text-2xl font-extrabold text-amber-400 tabular-nums mb-0.5">{fmt(bestMonth.cash)}</p>
                  <p className="text-xs text-[#4b5563] mb-3">{monthKeyLabel(bestMonth.key)}</p>
                  <div className="flex gap-4 text-xs text-[#6b7280]">
                    <span><span className="text-[#9ca3af] font-semibold">{bestMonth.calls}</span> calls</span>
                    <span><span className="text-[#9ca3af] font-semibold">{bestMonth.offersTaken}</span> closes</span>
                    <span><span className="text-[#9ca3af] font-semibold">{fmt(bestMonth.commission)}</span> commission</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share callout */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-5 py-4 flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-[#f0f2f8] mb-0.5">Share your stats card</p>
          <p className="text-xs text-[#6b7280]">Public link — clean stats card for job apps, offers, or flex.</p>
        </div>
        <CopyLinkButton url={publicUrl} label="Copy link" />
      </div>

      {/* Get Verified section */}
      <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <p className="text-sm font-bold text-[#f0f2f8]">Get Verified</p>
        </div>
        <p className="text-xs text-[#6b7280] mb-5 leading-relaxed">
          Have a manager verify your stats. We&apos;ll email them a branded summary and a one-click confirm button.
          A green verified badge will appear on your public stats card.
        </p>
        <VerificationForm status={verificationStatus} existing={verifyReq ?? null} />
      </div>
    </div>
  );
  } catch (err) {
    console.error("[stats] unhandled render error:", err);
    throw err;
  }
}
