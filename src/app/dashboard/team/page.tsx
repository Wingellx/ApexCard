import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getUserTeam,
  getTeamLeaderboard,
  thisMonthBounds,
  type TeamMemberStat,
} from "@/lib/queries";
import { Users, Crown, ExternalLink, ShieldCheck } from "lucide-react";

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

// ── Rank badge ───────────────────────────────────────────────

function RankBadge({ rank, isYou }: { rank: number; isYou: boolean }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-extrabold";
  if (rank === 1) return (
    <div className={`${base} bg-amber-500/15 border border-amber-500/30`}>
      <Crown className="w-3.5 h-3.5 text-amber-400" />
    </div>
  );
  if (rank === 2) return (
    <div className={`${base} bg-slate-400/10 border border-slate-400/20 text-slate-400`}>2</div>
  );
  if (rank === 3) return (
    <div className={`${base} bg-orange-700/10 border border-orange-700/25 text-orange-600`}>3</div>
  );
  return (
    <div className={`${base} ${isYou ? "bg-indigo-500/15 border border-indigo-500/30 text-indigo-400" : "bg-[#1a1d28] border border-[#1e2130] text-[#374151]"} text-xs`}>
      {rank}
    </div>
  );
}

// ── Member row ───────────────────────────────────────────────

function MemberRow({
  entry,
  rank,
  isYou,
}: {
  entry: TeamMemberStat;
  rank: number;
  isYou: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 rounded-xl transition-colors ${isYou ? "bg-indigo-500/[0.06] border border-indigo-500/20" : "bg-[#0f1117] border border-[#1e2130] hover:bg-[#111520]"}`}>
      <RankBadge rank={rank} isYou={isYou} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className={`font-bold truncate text-[13px] ${isYou ? "text-indigo-300" : rank <= 3 ? "text-[#f0f2f8]" : "text-[#d1d5db]"}`}>
            {entry.name}
            {isYou && <span className="text-[10px] font-semibold text-indigo-400/70 ml-1.5">you</span>}
          </span>
          {entry.isVerified && <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />}
          {entry.role && (
            <span className="text-[10px] font-semibold text-[#374151] bg-[#1a1d28] border border-[#1e2130] px-1.5 py-0.5 rounded-full shrink-0">
              {ROLE_LABELS[entry.role] ?? entry.role}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-3 flex-wrap text-[12px]">
          <span className={`font-extrabold tabular-nums ${rank === 1 ? "text-amber-400" : "text-emerald-400"}`}>
            {fmt(entry.totalCash)}
          </span>
          <span className="text-[#374151]">{fmtNum(entry.totalCalls)} calls</span>
          <span className="text-[#374151]">{entry.closeRate.toFixed(1)}% close</span>
        </div>
      </div>

      {entry.username ? (
        <Link
          href={`/card/${entry.username}`}
          className="shrink-0 p-1.5 text-[#2d3147] hover:text-indigo-400 transition-colors rounded-lg hover:bg-indigo-500/[0.06]"
          title="View ApexCard"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      ) : (
        <div className="w-7 shrink-0" />
      )}
    </div>
  );
}

// ── Leaderboard section ──────────────────────────────────────

function LeaderboardSection({
  title,
  entries,
  userId,
  accentClass,
}: {
  title: string;
  entries: TeamMemberStat[];
  userId: string;
  accentClass: string;
}) {
  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden">
      <div className={`h-[2px] ${accentClass}`} />
      <div className="p-5">
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-4">{title}</p>
        {entries.length === 0 ? (
          <p className="text-sm text-[#374151] py-4 text-center">No logs yet for this period.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <MemberRow
                key={entry.userId}
                entry={entry}
                rank={i + 1}
                isYou={entry.userId === userId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userTeam = await getUserTeam(user.id);
  if (!userTeam) redirect("/dashboard");

  const { first, last } = thisMonthBounds();

  const [monthlyBoard, allTimeBoard] = await Promise.all([
    getTeamLeaderboard(userTeam.teamId, first, last),
    getTeamLeaderboard(userTeam.teamId),
  ]);

  const myMonthlyRank  = monthlyBoard.findIndex((e) => e.userId === user.id) + 1;
  const myAllTimeRank  = allTimeBoard.findIndex((e) => e.userId === user.id) + 1;
  const memberCount    = allTimeBoard.length;

  return (
    <div className="px-4 sm:px-8 py-8 max-w-[900px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          {userTeam.team.logo_url ? (
            <img
              src={userTeam.team.logo_url}
              alt={userTeam.team.name}
              className="w-12 h-12 rounded-xl object-cover border border-white/[0.08] shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">{userTeam.team.name}</h1>
            {userTeam.team.description && (
              <p className="text-sm text-[#6b7280] mt-0.5">{userTeam.team.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-xs text-[#4b5563]">
          <Users className="w-3.5 h-3.5" />
          <span>{memberCount} member{memberCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Your rank cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">Your rank · {currentMonthLabel()}</p>
          {myMonthlyRank > 0 ? (
            <>
              <p className="text-3xl font-black text-[#f0f2f8] tabular-nums leading-none mb-0.5">
                #{myMonthlyRank}
              </p>
              <p className="text-xs text-[#4b5563]">of {memberCount}</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-black text-[#374151] leading-none mb-0.5">—</p>
              <p className="text-xs text-[#374151]">No logs this month</p>
            </>
          )}
        </div>
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-2">Your rank · All Time</p>
          {myAllTimeRank > 0 ? (
            <>
              <p className="text-3xl font-black text-[#f0f2f8] tabular-nums leading-none mb-0.5">
                #{myAllTimeRank}
              </p>
              <p className="text-xs text-[#4b5563]">of {memberCount}</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-black text-[#374151] leading-none mb-0.5">—</p>
              <p className="text-xs text-[#374151]">No logs yet</p>
            </>
          )}
        </div>
      </div>

      {/* Leaderboards */}
      <div className="space-y-4">
        <LeaderboardSection
          title={`This Month · ${currentMonthLabel()}`}
          entries={monthlyBoard}
          userId={user.id}
          accentClass="bg-indigo-500 shadow-[0_2px_14px_2px_rgba(99,102,241,0.3)]"
        />
        <LeaderboardSection
          title="All Time"
          entries={allTimeBoard}
          userId={user.id}
          accentClass="bg-amber-500 shadow-[0_2px_14px_2px_rgba(245,158,11,0.28)]"
        />
      </div>
    </div>
  );
}
