import Link from "next/link";
import { getCommunityRankings, getIndividualRankings, type CommunityRankingRow, type IndividualRankingRow, type Division } from "@/lib/community-rankings";
import { Crown, TrendingUp, TrendingDown, Minus, Users, Zap, Trophy, BarChart3, Target } from "lucide-react";

type Tab = "sales" | "improvement" | "mixed" | "individuals";
type Track = "sales" | "improvement";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TIER_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: "Tier 1", color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/25" },
  2: { label: "Tier 2", color: "text-slate-400",  bg: "bg-slate-500/10 border-slate-400/20" },
  3: { label: "Tier 3", color: "text-orange-700", bg: "bg-orange-700/10 border-orange-700/20" },
};

const DIV_LABELS: Record<string, string> = {
  sales:       "Sales",
  improvement: "Improvement",
  mixed:       "Mixed",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const ROLE_LABELS: Record<string, string> = {
  closer:   "Closer",
  setter:   "Setter",
  operator: "Operator",
  manager:  "Manager",
};

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

function ChangeIndicator({ change }: { change: number | null }) {
  if (change == null)  return <Minus className="w-3.5 h-3.5 text-[#374151]" />;
  if (change > 0)      return <TrendingUp   className="w-3.5 h-3.5 text-emerald-400" />;
  if (change < 0)      return <TrendingDown className="w-3.5 h-3.5 text-rose-400" />;
  return <Minus className="w-3.5 h-3.5 text-[#374151]" />;
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
        active
          ? "bg-white/10 text-white border border-white/20"
          : "text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.04]"
      }`}
    >
      {children}
    </Link>
  );
}

// ── Community row ─────────────────────────────────────────────────────────────

function CommunityRow({ row, rank }: { row: CommunityRankingRow; rank: number }) {
  const tier    = TIER_LABELS[row.tier] ?? TIER_LABELS[2];
  const isTop3  = rank <= 3;
  const border  = rank === 1 ? "border-amber-500/20" : rank === 2 ? "border-slate-400/15" : rank === 3 ? "border-orange-700/20" : "border-[#1e2130]";

  return (
    <div className={`bg-[#0f1117] border ${border} rounded-2xl px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-4 hover:bg-[#111520] transition-colors`}>
      <RankBadge rank={rank} />

      {/* Logo or initial */}
      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center overflow-hidden border border-white/[0.08]"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        {row.logoUrl
          ? <img src={row.logoUrl} alt={row.name} className="w-full h-full object-cover" />
          : <span className="text-sm font-black text-white/60">{row.name[0]}</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`font-bold truncate ${isTop3 ? "text-[#f0f2f8] text-[15px]" : "text-[#d1d5db] text-[13px]"}`}>
            {row.name}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${tier.color} ${tier.bg}`}>
            {tier.label}
          </span>
          <span className="text-[10px] text-[#374151] bg-[#1a1d28] border border-[#1e2130] px-1.5 py-0.5 rounded-full">
            {DIV_LABELS[row.division]}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <span className="flex items-center gap-1 text-[#4b5563]">
            <Users className="w-3 h-3" />{row.memberCount} members
          </span>
          <span className="text-[#374151]">·</span>
          <span className="text-[#374151]">{row.activeMembers} active</span>
        </div>
      </div>

      {/* Score + change */}
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1.5 justify-end mb-0.5">
          <ChangeIndicator change={row.scoreChange} />
          <span className={`font-extrabold tabular-nums ${isTop3 ? "text-[20px]" : "text-[17px]"} ${rank === 1 ? "text-amber-400" : "text-[#f0f2f8]"}`}>
            {row.score}
          </span>
        </div>
        {row.scoreChange != null && row.scoreChange !== 0 && (
          <p className={`text-[10px] font-semibold tabular-nums ${row.scoreChange > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {row.scoreChange > 0 ? "+" : ""}{row.scoreChange} vs last mo.
          </p>
        )}
        {row.scoreChange === 0 && (
          <p className="text-[10px] text-[#374151]">no change</p>
        )}
        {row.scoreChange == null && (
          <p className="text-[10px] text-[#374151]">first month</p>
        )}
      </div>
    </div>
  );
}

// ── Individual row ────────────────────────────────────────────────────────────

function IndividualRow({ row, rank }: { row: IndividualRankingRow; rank: number }) {
  const isTop3 = rank <= 3;
  const border = rank === 1 ? "border-amber-500/20" : rank === 2 ? "border-slate-400/15" : rank === 3 ? "border-orange-700/20" : "border-[#1e2130]";

  return (
    <div className={`bg-[#0f1117] border ${border} rounded-2xl px-4 sm:px-5 py-3.5 flex items-center gap-3 sm:gap-4 hover:bg-[#111520] transition-colors`}>
      <RankBadge rank={rank} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`font-bold truncate ${isTop3 ? "text-[#f0f2f8] text-[15px]" : "text-[#d1d5db] text-[13px]"}`}>
            {row.name}
          </span>
          {row.salesRole && (
            <span className="text-[10px] text-[#374151] bg-[#1a1d28] border border-[#1e2130] px-1.5 py-0.5 rounded-full">
              {ROLE_LABELS[row.salesRole] ?? row.salesRole}
            </span>
          )}
          {row.communityName && (
            <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">
              {row.communityName}
            </span>
          )}
        </div>
      </div>

      <span className={`font-extrabold tabular-nums shrink-0 ${isTop3 ? "text-[20px]" : "text-[17px]"} ${rank === 1 ? "text-amber-400" : "text-emerald-400"}`}>
        {row.valueLabel}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CommunityRankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; track?: string }>;
}) {
  const sp    = await searchParams;
  const TABS: Tab[] = ["sales", "improvement", "mixed", "individuals"];
  const tab   = (TABS.includes(sp.tab as Tab) ? sp.tab : "sales") as Tab;
  const track = (sp.track === "improvement" ? "improvement" : "sales") as Track;

  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Fetch data
  let communityRows: Awaited<ReturnType<typeof getCommunityRankings>> = [];
  let individualRows: Awaited<ReturnType<typeof getIndividualRankings>> = [];

  if (tab !== "individuals") {
    communityRows = await getCommunityRankings(tab as Division);
  } else {
    individualRows = await getIndividualRankings(track);
  }

  const TAB_CONFIG = [
    { key: "sales",       label: "Sales",       icon: BarChart3 },
    { key: "improvement", label: "Improvement", icon: Zap       },
    { key: "mixed",       label: "Mixed",       icon: Target    },
    { key: "individuals", label: "Individuals", icon: Trophy    },
  ] as const;

  return (
    <div className="min-h-screen bg-[#080a0e] py-10 px-4">

      {/* Brand */}
      <div className="flex items-center justify-center gap-2 mb-10">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/logo.svg" alt="ApexCard" className="w-7 h-7" />
          <span className="text-[13px] font-semibold text-[#374151] group-hover:text-[#6b7280] transition-colors tracking-tight">
            ApexCard
          </span>
        </Link>
      </div>

      <div className="max-w-[740px] mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-5">
            <Trophy className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#f0f2f8] tracking-tight">Community Rankings</h1>
          <p className="text-[13px] text-[#374151] mt-2">{currentMonth} · Per capita scoring · Updated daily</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-[#0f1117] border border-[#1e2130] rounded-2xl p-1.5 overflow-x-auto">
          {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
            <TabLink
              key={key}
              href={`?tab=${key}`}
              active={tab === key}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </TabLink>
          ))}
        </div>

        {/* Scoring explanation */}
        {tab !== "individuals" && (
          <div className="bg-[#0f1117] border border-[#1e2130] rounded-xl px-4 py-3 text-[11px] text-[#4b5563]">
            {tab === "sales" && "Score = cash per active member ÷ 100 + close rate bonus · Per capita — team size doesn't inflate rank"}
            {tab === "improvement" && "Score = average execution score across all members · 0-100 scale"}
            {tab === "mixed" && "Score = blend of normalised sales performance and execution score · 0-100 scale"}
          </div>
        )}

        {/* Individual sub-tabs */}
        {tab === "individuals" && (
          <div className="flex gap-2">
            <Link
              href={`?tab=individuals&track=sales`}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${track === "sales" ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400" : "text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.04]"}`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Sales Track · Cash Collected
            </Link>
            <Link
              href={`?tab=individuals&track=improvement`}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${track === "improvement" ? "bg-violet-500/15 border border-violet-500/25 text-violet-400" : "text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.04]"}`}
            >
              <Zap className="w-3.5 h-3.5" /> Improvement Track · Execution Score
            </Link>
          </div>
        )}

        {/* Community rows */}
        {tab !== "individuals" && (
          communityRows.length === 0 ? (
            <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl p-12 text-center">
              <Trophy className="w-10 h-10 text-[#1e2130] mx-auto mb-4" />
              <p className="text-base font-bold text-[#d1d5db] mb-2">No communities yet</p>
              <p className="text-sm text-[#6b7280]">
                {tab === "sales" ? "No sales communities have logged this month." :
                 tab === "improvement" ? "No improvement communities have logged this month." :
                 "No mixed communities have logged this month."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {communityRows.map((row, i) => (
                <CommunityRow key={row.teamId} row={row} rank={i + 1} />
              ))}
            </div>
          )
        )}

        {/* Individual rows */}
        {tab === "individuals" && (
          individualRows.length === 0 ? (
            <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl p-12 text-center">
              <Trophy className="w-10 h-10 text-[#1e2130] mx-auto mb-4" />
              <p className="text-base font-bold text-[#d1d5db] mb-2">No data yet</p>
              <p className="text-sm text-[#6b7280]">No activity logged this month.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {individualRows.map((row, i) => (
                <IndividualRow key={row.userId} row={row} rank={i + 1} />
              ))}
            </div>
          )
        )}

        {/* Tier movement note */}
        {tab !== "individuals" && communityRows.length > 0 && (
          <div className="bg-[#0f1117] border border-[#1e2130] rounded-xl px-5 py-4">
            <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider mb-2">Tier Movement</p>
            <p className="text-[12px] text-[#374151]">
              At the end of each month, the top 2 communities in each tier advance to the next tier.
              The bottom 2 drop down. Tier 1 is the highest.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.03] px-0.5">
          <Link href="/leaderboard" className="text-[11px] text-[#374151] hover:text-indigo-400 transition-colors font-semibold">
            ← Individual leaderboard
          </Link>
          <Link href="/" className="text-[11px] text-[#374151] hover:text-indigo-400 transition-colors font-semibold">
            Get your card →
          </Link>
        </div>

      </div>
    </div>
  );
}
