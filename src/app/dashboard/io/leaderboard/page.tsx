import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getIOLeaderboard } from "@/lib/io-queries";
import { scoreColor, scoreLabel } from "@/lib/io-score";
import { Crown, Flame, TrendingUp, DollarSign, Zap, CalendarDays } from "lucide-react";

type Tab = "weekly" | "monthly" | "cash" | "streak";

const TABS: { key: Tab; label: string; icon: typeof Crown }[] = [
  { key: "weekly",  label: "This Week",  icon: Zap        },
  { key: "monthly", label: "This Month", icon: TrendingUp },
  { key: "streak",  label: "Streak",     icon: Flame      },
  { key: "cash",    label: "Cash",       icon: DollarSign },
];

const ROLE_LABELS: Record<string, string> = {
  closer:   "Closer",
  setter:   "Setter",
  operator: "Operator",
  manager:  "Manager",
};

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-4 h-4 text-amber-400" />;
  if (rank === 2) return <span className="text-xs font-black text-[#9ca3af]">#2</span>;
  if (rank === 3) return <span className="text-xs font-black text-amber-700">#3</span>;
  return <span className="text-xs font-semibold text-[#4b5563]">#{rank}</span>;
}

function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export default async function IOLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const tab = (["weekly", "monthly", "cash", "streak"].includes(params.tab ?? "") ? params.tab : "weekly") as Tab;

  const rows = await getIOLeaderboard(tab);

  const tabLabel = TABS.find(t => t.key === tab)?.label ?? "This Week";

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[800px] space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Brotherhood Leaderboard ⚔️</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          {rows.length} brother{rows.length !== 1 ? "s" : ""} executing · Ranked by Execution Score
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111318] border border-[#1e2130] rounded-xl p-1 w-fit overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <a
            key={key}
            href={`?tab=${key}`}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              tab === key
                ? "bg-white/10 text-white border border-white/20"
                : "text-[#6b7280] hover:text-[#9ca3af]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </a>
        ))}
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center">
          <p className="text-[#6b7280]">No brothers have logged yet — debriefs will appear here once the brotherhood starts executing.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => {
            const rank  = i + 1;
            const isMe  = row.userId === user.id;
            const ini   = initials(row.fullName);
            const color = scoreColor(row.score);

            return (
              <div
                key={row.userId}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  isMe
                    ? "border-white/20 bg-white/5"
                    : rank === 1
                    ? "border-amber-500/20 bg-amber-500/5"
                    : "border-[#1e2130] bg-[#111318]"
                }`}
              >
                {/* Rank */}
                <div className="w-8 flex items-center justify-center shrink-0">
                  <RankBadge rank={rank} />
                </div>

                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white select-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  {ini}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#f0f2f8] truncate">{row.fullName}</p>
                    {isMe && <span className="text-[10px] font-bold text-white bg-white/10 border border-white/20 px-1.5 py-0.5 rounded-full">You</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-[#9ca3af]">{ROLE_LABELS[row.role] ?? row.role}</span>
                    <span className="text-[10px] text-[#374151]">·</span>
                    <div className="flex items-center gap-0.5">
                      {row.trackingPref === "daily"
                        ? <Zap className="w-2.5 h-2.5 text-white/40" />
                        : <CalendarDays className="w-2.5 h-2.5 text-white/40" />}
                      <span className="text-[10px] text-[#4b5563] capitalize">{row.trackingPref}</span>
                    </div>
                    {row.cashCollected > 0 && (
                      <>
                        <span className="text-[10px] text-[#374151]">·</span>
                        <span className="text-[10px] text-emerald-600">{fmt(row.cashCollected)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Primary metric — always Execution Score + streak */}
                <div className="text-right shrink-0 space-y-1">
                  <div>
                    <span className={`text-xl font-extrabold tabular-nums ${row.score > 0 ? color : "text-[#374151]"}`}>
                      {row.score}
                    </span>
                    <span className="text-xs text-[#6b7280] font-normal">/100</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Flame className={`w-3 h-3 ${row.gymStreak > 0 ? "text-orange-400" : "text-[#374151]"}`} />
                    <span className={`text-xs font-semibold tabular-nums ${row.gymStreak > 0 ? "text-orange-400" : "text-[#374151]"}`}>
                      {row.gymStreak}d
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-[#374151] text-center">
        {tab === "weekly" && "Ranked by avg execution score · last 7 days"}
        {tab === "monthly" && "Ranked by avg execution score · last 30 days"}
        {tab === "streak" && "Ranked by consecutive gym days"}
        {tab === "cash" && "Ranked by total cash collected"}
      </p>
    </div>
  );
}
