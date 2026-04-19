import Link from "next/link";
import { Trophy, Crown, ExternalLink, ShieldCheck } from "lucide-react";
import {
  getLeaderboard,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardMetric,
} from "@/lib/queries";

// ── Formatters ────────────────────────────────────────────────────
const fmt    = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => n.toLocaleString();

const ROLE_LABELS: Record<string, string> = {
  closer:   "Closer",
  setter:   "Setter",
  operator: "Operator",
  manager:  "Manager",
};

function currentMonthLabel() {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ── URL builder ──────────────────────────────────────────────────
interface FilterState {
  period:   string;
  metric:   string;
  role:     string;
  verified: string;
}

function buildUrl(current: FilterState, patch: Partial<FilterState>): string {
  const next = { ...current, ...patch };
  const p = new URLSearchParams();
  if (next.period   !== "alltime")  p.set("period",   next.period);
  if (next.metric   !== "cash")     p.set("metric",   next.metric);
  if (next.role && next.role !== "all") p.set("role", next.role);
  if (next.verified === "1")        p.set("verified", "1");
  const s = p.toString();
  return s ? `/leaderboard?${s}` : "/leaderboard";
}

// ── Filter pill ──────────────────────────────────────────────────
function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "px-3.5 py-1.5 rounded-lg text-[12px] font-semibold bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 transition-all duration-150"
          : "px-3.5 py-1.5 rounded-lg text-[12px] font-medium text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.04] transition-all duration-150"
      }
    >
      {children}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-bold text-[#2d3147] uppercase tracking-[0.18em] mb-2">
      {children}
    </p>
  );
}

// ── Rank badge ───────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
      <Crown className="w-4 h-4 text-amber-400" />
    </div>
  );
  if (rank === 2) return (
    <div className="w-9 h-9 rounded-full bg-slate-400/10 border border-slate-400/20 flex items-center justify-center shrink-0">
      <span className="text-sm font-extrabold text-slate-400">2</span>
    </div>
  );
  if (rank === 3) return (
    <div className="w-9 h-9 rounded-full bg-orange-700/10 border border-orange-700/25 flex items-center justify-center shrink-0">
      <span className="text-sm font-extrabold text-orange-600">3</span>
    </div>
  );
  return (
    <div className="w-9 h-9 rounded-full bg-[#1a1d28] border border-[#1e2130] flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-[#374151] tabular-nums">{rank}</span>
    </div>
  );
}

// ── Entry card ───────────────────────────────────────────────────
function EntryCard({ entry, rank, metric }: { entry: LeaderboardEntry; rank: number; metric: LeaderboardMetric }) {
  const isTop3 = rank <= 3;

  const borderClass =
    rank === 1 ? "border-amber-500/20 ring-1 ring-amber-500/[0.08]" :
    rank === 2 ? "border-slate-500/15" :
    rank === 3 ? "border-orange-700/20" :
    "border-[#1e2130]";

  // Primary metric value + color — cash is hidden unless metric === 'cash'
  const primary = {
    cash:       { value: fmt(entry.total_cash),                    color: "text-emerald-400" },
    close_rate: { value: `${entry.close_rate.toFixed(1)}%`,        color: "text-indigo-400"  },
    calls:      { value: fmtNum(entry.total_calls),                color: "text-violet-400"  },
    offers:     { value: fmtNum(entry.total_offers_taken),         color: "text-amber-400"   },
  }[metric];

  // Secondary line — always shows close rate context, never cash if metric !== cash
  const secondary =
    metric === "cash"       ? `${entry.close_rate.toFixed(1)}% close rate` :
    metric === "close_rate" ? `${fmtNum(entry.total_calls)} calls · ${fmtNum(entry.total_offers_taken)} closed` :
    metric === "calls"      ? `${entry.close_rate.toFixed(1)}% close rate · ${fmtNum(entry.total_offers_taken)} closed` :
                              `${entry.close_rate.toFixed(1)}% close rate · ${fmtNum(entry.total_calls)} calls`;

  return (
    <div className={`bg-[#0f1117] border ${borderClass} rounded-2xl px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-4 transition-colors hover:bg-[#111520]`}>
      <RankBadge rank={rank} />

      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`font-bold truncate ${isTop3 ? "text-[#f0f2f8] text-[15px]" : "text-[#d1d5db] text-[13px]"}`}>
            {entry.name}
          </span>
          {entry.is_verified && (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          {entry.role && (
            <span className="text-[10px] font-semibold text-[#374151] bg-[#1a1d28] border border-[#1e2130] px-2 py-0.5 rounded-full shrink-0">
              {ROLE_LABELS[entry.role] ?? entry.role}
            </span>
          )}
        </div>
        {/* Stats row */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className={`font-extrabold tabular-nums ${primary.color} ${isTop3 ? "text-[18px]" : "text-[16px]"}`}>
            {primary.value}
          </span>
          <span className="text-[12px] text-[#374151] tabular-nums">{secondary}</span>
          <span className="text-[11px] text-[#2d3147] tabular-nums">· {entry.days_logged}d logged</span>
        </div>
      </div>

      {entry.username ? (
        <Link
          href={`/card/${entry.username}`}
          className="shrink-0 p-2 text-[#2d3147] hover:text-indigo-400 transition-colors rounded-lg hover:bg-indigo-500/[0.06]"
          title="View ApexCard"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      ) : (
        <div className="w-8 shrink-0" />
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; metric?: string; role?: string; verified?: string }>;
}) {
  const sp = await searchParams;

  const VALID_PERIODS:  LeaderboardPeriod[] = ["alltime", "monthly", "30d", "7d"];
  const VALID_METRICS:  LeaderboardMetric[] = ["cash", "close_rate", "calls", "offers"];
  const VALID_ROLES = ["all", "closer", "setter", "operator", "manager"];

  const period   = (VALID_PERIODS.includes(sp.period as LeaderboardPeriod)  ? sp.period  : "alltime")  as LeaderboardPeriod;
  const metric   = (VALID_METRICS.includes(sp.metric as LeaderboardMetric)  ? sp.metric  : "cash")     as LeaderboardMetric;
  const role     = VALID_ROLES.includes(sp.role ?? "")                       ? sp.role!   : "all";
  const verified = sp.verified === "1";

  const filters: FilterState = {
    period,
    metric,
    role,
    verified: verified ? "1" : "0",
  };

  const entries = await getLeaderboard({
    period,
    metric,
    role:        role !== "all" ? role : null,
    verifiedOnly: verified,
  });

  const periodLabel =
    period === "monthly" ? currentMonthLabel() :
    period === "30d"     ? "Last 30 Days" :
    period === "7d"      ? "Last 7 Days" :
    "All Time";

  return (
    <div className="min-h-screen bg-[#080a0e] py-10 px-4">

      {/* Brand */}
      <div className="animate-in flex items-center justify-center gap-2 mb-10">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/logo.svg" alt="ApexCard" className="w-7 h-7" />
          <span className="text-[13px] font-semibold text-[#374151] group-hover:text-[#6b7280] transition-colors tracking-tight">
            ApexCard
          </span>
        </Link>
      </div>

      <div className="max-w-[680px] mx-auto">

        {/* Header */}
        <div className="animate-in text-center mb-8" style={{ animationDelay: "60ms" }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-5">
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f0f2f8] tracking-tight">Leaderboard</h1>
          <p className="text-[13px] text-[#374151] mt-2">{periodLabel} · ApexCard</p>
        </div>

        {/* Filters panel */}
        <div
          className="animate-in bg-[#0f1117] ring-1 ring-white/[0.05] rounded-2xl p-4 mb-6 space-y-4"
          style={{ animationDelay: "100ms" }}
        >
          {/* Period */}
          <div>
            <SectionLabel>Period</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {([ ["alltime", "All Time"], ["monthly", "This Month"], ["30d", "Last 30 Days"], ["7d", "Last 7 Days"] ] as const).map(([val, label]) => (
                <Pill key={val} href={buildUrl(filters, { period: val })} active={period === val}>
                  {label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Metric */}
          <div>
            <SectionLabel>Rank by</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {([ ["cash", "Cash Collected"], ["close_rate", "Close Rate"], ["calls", "Calls Taken"], ["offers", "Offers Closed"] ] as const).map(([val, label]) => (
                <Pill key={val} href={buildUrl(filters, { metric: val })} active={metric === val}>
                  {label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Role + Verified */}
          <div>
            <SectionLabel>Filters</SectionLabel>
            <div className="flex flex-wrap gap-1.5 items-center">
              {([ ["all", "All Roles"], ["closer", "Closers"], ["setter", "Setters"], ["operator", "Operators"], ["manager", "Managers"] ] as const).map(([val, label]) => (
                <Pill key={val} href={buildUrl(filters, { role: val })} active={role === val}>
                  {label}
                </Pill>
              ))}
              <div className="w-px h-4 bg-white/[0.06] mx-0.5 shrink-0" />
              <Link
                href={buildUrl(filters, { verified: verified ? "0" : "1" })}
                className={
                  verified
                    ? "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 transition-all duration-150"
                    : "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.04] transition-all duration-150"
                }
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                Verified only
              </Link>
            </div>
          </div>
        </div>

        {/* Entries */}
        {entries.length === 0 ? (
          <div
            className="animate-in bg-[#0f1117] ring-1 ring-white/[0.05] rounded-2xl px-6 py-16 text-center"
            style={{ animationDelay: "160ms" }}
          >
            {verified ? (
              <>
                <ShieldCheck className="w-10 h-10 text-[#1e2130] mx-auto mb-4" />
                <p className="text-base font-bold text-[#d1d5db] mb-2">No verified reps match these filters</p>
                <p className="text-sm text-[#6b7280] leading-relaxed max-w-sm mx-auto">
                  Try removing the &ldquo;Verified only&rdquo; filter, or check back after more reps get verified.
                </p>
                <Link
                  href={buildUrl(filters, { verified: "0" })}
                  className="inline-flex items-center gap-2 mt-6 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-sm font-semibold text-[#d1d5db] px-5 py-2.5 rounded-xl transition-colors"
                >
                  Show all reps
                </Link>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-lg font-extrabold text-[#f0f2f8] tracking-tight mb-2">Be the first on the leaderboard</p>
                <p className="text-sm text-[#6b7280] leading-relaxed max-w-sm mx-auto mb-6">
                  No one has opted in yet. Enable leaderboard visibility in your profile settings and your stats will appear here.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/dashboard/profile"
                    className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Enable in profile settings
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#4b5563] hover:text-[#9ca3af] transition-colors"
                  >
                    Get your ApexCard →
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="animate-in"
                style={{ animationDelay: `${160 + i * 35}ms` }}
              >
                <EntryCard entry={entry} rank={i + 1} metric={metric} />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          className="animate-in flex items-center justify-between mt-8 pt-5 border-t border-white/[0.03] px-0.5"
          style={{ animationDelay: "500ms" }}
        >
          <p className="text-[11px] text-[#1f2937]">
            Opt-in only · Minimum {period === "alltime" ? 5 : period === "monthly" ? 3 : period === "30d" ? 2 : 1} days logged
          </p>
          <Link
            href="/"
            className="text-[11px] text-[#374151] hover:text-indigo-400 transition-colors font-semibold"
          >
            Get your card →
          </Link>
        </div>

      </div>
    </div>
  );
}
