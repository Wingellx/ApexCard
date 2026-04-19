import { PhoneCall, TrendingUp, Target, DollarSign, Handshake, Wallet, CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getMonthCallLogs, getLast30DaysLogs, getMonthGoals, getProfile,
  getLoggedDates, calculateStreak, getDateRangeLogs,
  thisWeekBounds, lastWeekBounds, lastMonthBounds,
} from "@/lib/queries";
import MetricCard from "@/components/dashboard/MetricCard";
import GoalsCard from "@/components/dashboard/GoalsCard";
import RecentLogs from "@/components/dashboard/RecentLogs";
import DailyCashChart from "@/components/dashboard/DailyCashChart";
import CloseRateTrendChart from "@/components/dashboard/CloseRateTrendChart";
import StreakBadge from "@/components/dashboard/StreakBadge";
import { NoLogsState, NoGoalsState } from "@/components/dashboard/EmptyState";
import WeeklySummary from "@/components/dashboard/WeeklySummary";
import MonthlySummaryCard from "@/components/dashboard/MonthlySummaryCard";

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(num: number, den: number) { return den > 0 ? (num / den) * 100 : 0; }

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function daysLeftInMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
}

function monthLabel() {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatShortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function firstName(fullName?: string | null, email?: string | null) {
  if (fullName?.trim()) return fullName.trim().split(" ")[0];
  if (email) return email.split("@")[0];
  return "there";
}

// Build all days of current month for the bar chart (fills 0 for days with no data)
function buildDailyCashData(rows: { date: string; cash_collected?: number | null }[]) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cashByDate = Object.fromEntries(rows.map((r) => [r.date, Number(r.cash_collected ?? 0)]));
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return { date: `${d}`, cash: cashByDate[iso] ?? 0 };
  });
}

// Build close rate points for last-30-days line chart
function buildCloseRateTrend(rows: { date: string; shows?: number | null; offers_taken?: number | null }[]) {
  return rows
    .filter((r) => (r.shows ?? 0) > 0)
    .map((r) => ({
      date: formatShortDate(r.date),
      closeRate: pct(r.offers_taken ?? 0, r.shows ?? 0),
    }));
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const tw = thisWeekBounds();
  const lw = lastWeekBounds();
  const lm = lastMonthBounds();

  const [{ rows }, last30, goals, profile, allDates, thisWeekLogs, lastWeekLogs, lastMonthLogs] = await Promise.all([
    user ? getMonthCallLogs(user.id)                            : Promise.resolve({ rows: [] as never[] }),
    user ? getLast30DaysLogs(user.id)                           : Promise.resolve([] as never[]),
    user ? getMonthGoals(user.id)                               : Promise.resolve(null),
    user ? getProfile(user.id)                                  : Promise.resolve(null),
    user ? getLoggedDates(user.id)                              : Promise.resolve([] as string[]),
    user ? getDateRangeLogs(user.id, tw.start, tw.end)          : Promise.resolve([] as never[]),
    user ? getDateRangeLogs(user.id, lw.start, lw.end)          : Promise.resolve([] as never[]),
    user ? getDateRangeLogs(user.id, lm.first, lm.last)         : Promise.resolve([] as never[]),
  ]);

  // ── Aggregates ───────────────────────────────────────────────────
  const totals = rows.reduce(
    (a: { calls: number; shows: number; offersMade: number; offersTaken: number; cash: number; commission: number }, r: { calls_taken?: number; shows?: number; offers_made?: number; offers_taken?: number; cash_collected?: number | string; commission_earned?: number | string }) => ({
      calls:       a.calls       + (r.calls_taken       ?? 0),
      shows:       a.shows       + (r.shows             ?? 0),
      offersMade:  a.offersMade  + (r.offers_made       ?? 0),
      offersTaken: a.offersTaken + (r.offers_taken      ?? 0),
      cash:        a.cash        + Number(r.cash_collected    ?? 0),
      commission:  a.commission  + Number(r.commission_earned ?? 0),
    }),
    { calls: 0, shows: 0, offersMade: 0, offersTaken: 0, cash: 0, commission: 0 }
  );

  const showRate  = pct(totals.shows, totals.calls);
  const closeRate = pct(totals.offersTaken, totals.shows);
  const hasData   = rows.length > 0;
  const daysLeft  = daysLeftInMonth();
  const streak    = calculateStreak(allDates);

  // Chart data
  const dailyCashData    = buildDailyCashData(rows as { date: string; cash_collected?: number | null }[]);
  const closeRateTrend   = buildCloseRateTrend(last30 as { date: string; shows?: number | null; offers_taken?: number | null }[]);
  const avgCloseRate30   = closeRateTrend.length > 0
    ? closeRateTrend.reduce((s, d) => s + d.closeRate, 0) / closeRateTrend.length
    : 0;

  // ── Metric cards ─────────────────────────────────────────────────
  const metrics = [
    { label: "Calls Taken",       value: hasData ? String(totals.calls) : "—",                    subvalue: hasData ? `${totals.shows} showed` : "No logs yet",                                     icon: PhoneCall,  accent: "indigo"  as const },
    { label: "Show Rate",         value: hasData ? `${showRate.toFixed(1)}%` : "—",               subvalue: hasData ? `${totals.shows} of ${totals.calls} calls` : "No logs yet",                   icon: TrendingUp, accent: "emerald" as const },
    { label: "Close Rate",        value: hasData ? `${closeRate.toFixed(1)}%` : "—",              subvalue: hasData ? `${totals.offersTaken} of ${totals.shows} shows` : "No logs yet",              icon: Target,     accent: "amber"   as const },
    { label: "Offers Made",       value: hasData ? String(totals.offersMade) : "—",               subvalue: hasData ? `${totals.offersTaken} closed` : "No logs yet",                               icon: Handshake,  accent: "cyan"    as const },
    { label: "Cash Collected",    value: hasData ? fmt(totals.cash) : "—",                        subvalue: hasData ? `across ${totals.offersTaken} closes` : "No logs yet",                        icon: DollarSign, accent: "emerald" as const },
    { label: "Commission Earned", value: hasData ? fmt(totals.commission) : "—",                  subvalue: hasData && totals.cash > 0 ? `${((totals.commission / totals.cash) * 100).toFixed(1)}% rate` : "No logs yet", icon: Wallet, accent: "violet" as const },
  ];

  // ── Goals vs actuals ─────────────────────────────────────────────
  const goalsRows = goals ? [
    { label: "Calls Taken",    actual: totals.calls,       target: goals.calls_target,      format: "number"   as const },
    { label: "Show Rate",      actual: showRate,            target: goals.show_rate_target,  format: "percent"  as const },
    { label: "Close Rate",     actual: closeRate,           target: goals.close_rate_target, format: "percent"  as const },
    { label: "Offers Made",    actual: totals.offersMade,   target: goals.offers_target,     format: "number"   as const },
    { label: "Cash Collected", actual: totals.cash,         target: goals.cash_target,       format: "currency" as const },
    { label: "Commission",     actual: totals.commission,   target: goals.commission_target, format: "currency" as const },
  ] : [];

  // ── Pace ─────────────────────────────────────────────────────────
  const cashTarget    = goals?.cash_target ?? 0;
  const cashPct       = cashTarget > 0 ? Math.round((totals.cash / cashTarget) * 100) : 0;
  const cashRemaining = Math.max(cashTarget - totals.cash, 0);
  const perDay        = daysLeft > 0 && cashRemaining > 0 ? cashRemaining / daysLeft : 0;

  // ── Recent logs ──────────────────────────────────────────────────
  const recentLogs = (rows as { date: string; calls_taken?: number; shows?: number; offers_made?: number; offers_taken?: number; cash_collected?: number | string; commission_earned?: number | string }[])
    .slice(0, 7).map((r) => ({
      date:        formatShortDate(r.date),
      calls:       r.calls_taken  ?? 0,
      shows:       r.shows        ?? 0,
      offersMade:  r.offers_made  ?? 0,
      offersTaken: r.offers_taken ?? 0,
      cash:        Number(r.cash_collected    ?? 0),
      commission:  Number(r.commission_earned ?? 0),
    }));

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1400px]">

      {/* Header */}
      <div className="animate-in flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> {today}
            </p>
            <StreakBadge streak={streak} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#f0f2f8] tracking-tight">
            {greeting()}, {firstName(profile?.full_name, profile?.email ?? user?.email)} 👋
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            {hasData ? `Here's how ${monthLabel()} is shaping up.` : "Welcome! Log your first calls to get started."}
          </p>
        </div>
        <Link
          href="/dashboard/log"
          className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" /> Log Today
        </Link>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metrics.map((m, i) => (
          <div key={m.label} className="animate-in" style={{ animationDelay: `${80 + i * 60}ms` }}>
            <MetricCard {...m} />
          </div>
        ))}
      </div>

      {/* No data CTA */}
      {!hasData && <div className="mb-6"><NoLogsState /></div>}

      {/* Charts */}
      {hasData && (
        <div className="animate-in grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6" style={{ animationDelay: "500ms" }}>
          <DailyCashChart data={dailyCashData} />
          <CloseRateTrendChart data={closeRateTrend} avgCloseRate={avgCloseRate30} />
        </div>
      )}

      {/* Weekly + Monthly summary */}
      {hasData && (
        <div className="animate-in grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6" style={{ animationDelay: "560ms" }}>
          <WeeklySummary thisWeekLogs={thisWeekLogs as Parameters<typeof WeeklySummary>[0]["thisWeekLogs"]} lastWeekLogs={lastWeekLogs as Parameters<typeof WeeklySummary>[0]["lastWeekLogs"]} />
          <MonthlySummaryCard thisMonthLogs={rows as Parameters<typeof MonthlySummaryCard>[0]["thisMonthLogs"]} lastMonthLogs={lastMonthLogs as Parameters<typeof MonthlySummaryCard>[0]["lastMonthLogs"]} goals={goals} monthLabel={monthLabel()} />
        </div>
      )}

      {/* Goals + Recent logs */}
      {(hasData || goals) && (
        <div className="animate-in grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6" style={{ animationDelay: "600ms" }}>
          <div className="xl:col-span-1">
            {goals ? <GoalsCard goals={goalsRows} period={monthLabel()} /> : <NoGoalsState />}
          </div>
          <div className="xl:col-span-2">
            {hasData ? (
              <RecentLogs logs={recentLogs} />
            ) : (
              <div className="bg-[#111318] border border-dashed border-[#1e2130] rounded-xl h-full flex items-center justify-center p-10">
                <p className="text-sm text-[#6b7280]">Recent call logs will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pace banner */}
      {hasData && cashTarget > 0 && (
        <div className="bg-[#111318] border border-indigo-500/20 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${cashPct >= 100 ? "bg-emerald-400" : cashPct >= 70 ? "bg-amber-400" : "bg-rose-400"}`} />
            {cashPct >= 100 ? (
              <p className="text-sm text-[#f0f2f8]">
                You&apos;ve <span className="font-bold text-emerald-400">hit your cash goal</span> for {monthLabel()}. 🎉
              </p>
            ) : (
              <p className="text-sm text-[#f0f2f8]">
                You&apos;re at <span className={`font-bold ${cashPct >= 70 ? "text-amber-400" : "text-rose-400"}`}>{cashPct}%</span> of your cash goal with{" "}
                <span className="font-bold text-[#f0f2f8]">{daysLeft} day{daysLeft !== 1 ? "s" : ""} left</span>.
                {perDay > 0 && <> You need <span className="font-bold text-emerald-400">{fmt(perDay)}/day</span> to hit target.</>}
              </p>
            )}
          </div>
          <Link href="/dashboard/goals" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold whitespace-nowrap ml-6 transition-colors">
            Edit goals →
          </Link>
        </div>
      )}

      {/* No goals nudge */}
      {hasData && !goals && (
        <div className="bg-[#111318] border border-dashed border-[#1e2130] rounded-xl px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-[#6b7280]">You have call data but no goals set for {monthLabel()}.</p>
          <Link href="/dashboard/goals" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold ml-6 transition-colors">
            Set goals →
          </Link>
        </div>
      )}
    </div>
  );
}
