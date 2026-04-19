import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getTodayCheckin, getGymStreak, getScoreAverages, getIOMemberCount,
} from "@/lib/io-queries";
import { getCheckinDateKey, scoreColor, scoreBg, scoreLabel, DAY_LABELS, todayDayOfWeek } from "@/lib/io-score";
import { getLoggedDates, calculateStreak } from "@/lib/queries";
import { Zap, Flame, Target, TrendingUp, ArrowRight, CheckCircle2, Clock } from "lucide-react";

function ScoreArc({ score }: { score: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 85 ? "#34d399" : score >= 65 ? "#fbbf24" : "#f87171";
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e2130" strokeWidth="8" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="50" y="46" textAnchor="middle" fill={color} fontSize="16" fontWeight="800">{score}</text>
      <text x="50" y="60" textAnchor="middle" fill="#6b7280" fontSize="9">/100</text>
    </svg>
  );
}

function ScoreBreakdownRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#6b7280] w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%`, transition: "width 0.5s ease" }} />
      </div>
      <span className="text-xs font-bold text-[#f0f2f8] w-12 text-right tabular-nums">{value}/{max}</span>
    </div>
  );
}

function Sparkline({ data }: { data: { performance_score: number }[] }) {
  if (data.length < 2) return null;
  const vals = data.map(d => d.performance_score);
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const range = Math.max(max - min, 1);
  const W = 120, H = 32;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-60">
      <polyline points={pts} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function IODashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tracking_preference, full_name")
    .eq("id", user.id)
    .single();

  const pref       = (profile?.tracking_preference ?? "daily") as "daily" | "weekly";
  const dateKey    = getCheckinDateKey(pref);
  const firstName  = profile?.full_name?.split(" ")[0] ?? "there";

  const [checkin, gymStreak, salesStreak, averages, memberCount] = await Promise.all([
    getTodayCheckin(user.id, dateKey),
    getGymStreak(user.id),
    getLoggedDates(user.id).then(calculateStreak),
    getScoreAverages(user.id),
    getIOMemberCount(),
  ]);

  const periodLabel = pref === "daily" ? "today" : "this week";
  const checkedIn   = !!checkin;

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px] space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-violet-500/20 border border-violet-500/30 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">IO Community</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Hey, {firstName}.</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            {memberCount} member{memberCount !== 1 ? "s" : ""} · {pref === "daily" ? "Daily" : "Weekly"} tracker
          </p>
        </div>

        {!checkedIn && (
          <Link
            href="/dashboard/io/checkin"
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-violet-500/20"
          >
            <Target className="w-4 h-4" />
            Check in {periodLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Check-in status */}
      {checkedIn ? (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-6">
          <div className="flex items-start gap-6 flex-wrap">
            <ScoreArc score={checkin.performance_score} />
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <p className="text-sm font-semibold text-[#f0f2f8] capitalize">
                    {scoreLabel(checkin.performance_score)} performance {periodLabel}
                  </p>
                </div>
                <p className={`text-2xl font-extrabold ${scoreColor(checkin.performance_score)}`}>
                  {checkin.performance_score}/100
                </p>
              </div>
              <div className="space-y-2.5">
                <ScoreBreakdownRow label="Work"          value={checkin.score_work}           max={35} color="bg-indigo-500"  />
                <ScoreBreakdownRow label="Fitness"       value={checkin.score_fitness}        max={35} color="bg-emerald-500" />
                <ScoreBreakdownRow label="Accountability" value={checkin.score_accountability} max={30} color="bg-amber-500"  />
              </div>
            </div>
          </div>
          {checkin.accomplishment && (
            <div className="mt-5 pt-5 border-t border-[#1e2130]">
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1">Accomplished</p>
              <p className="text-sm text-[#9ca3af] italic">&ldquo;{checkin.accomplishment}&rdquo;</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#111318] border border-dashed border-[#1e2130] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-violet-400" />
          </div>
          <p className="font-semibold text-[#f0f2f8] mb-1">No check-in {periodLabel}</p>
          <p className="text-sm text-[#6b7280] mb-5">Log your workout, work, and focus to get your score.</p>
          <Link
            href="/dashboard/io/checkin"
            className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Start check-in <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Streaks + averages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Gym Streak",    value: gymStreak,         suffix: "days", icon: Flame,    color: "text-orange-400" },
          { label: "Sales Streak",  value: salesStreak,       suffix: "days", icon: TrendingUp,color:"text-indigo-400"  },
          { label: "Weekly Avg",    value: averages.weekly ?? "—", suffix: averages.weekly ? "/100" : "", icon: Zap,  color: averages.weekly ? scoreColor(averages.weekly as number) : "text-[#6b7280]" },
          { label: "Monthly Avg",   value: averages.monthly ?? "—",suffix:averages.monthly ? "/100" : "",icon: Target,color: averages.monthly ? scoreColor(averages.monthly as number) : "text-[#6b7280]" },
        ].map(({ label, value, suffix, icon: Icon, color }) => (
          <div key={label} className="bg-[#111318] border border-[#1e2130] rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">{label}</p>
            </div>
            <p className={`text-2xl font-extrabold tabular-nums ${color}`}>
              {value}<span className="text-sm font-normal text-[#6b7280] ml-0.5">{suffix}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Score history sparkline */}
      {averages.history.length >= 2 && (
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-0.5">Score trend</p>
            <p className="text-sm text-[#9ca3af]">Last {averages.history.length} check-ins</p>
          </div>
          <Sparkline data={averages.history} />
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/dashboard/io/checkin",     label: "Check-in",   desc: pref === "daily" ? "Daily log" : "Weekly log" },
          { href: "/dashboard/io/training",    label: "Training",   desc: "Split + calendar" },
          { href: "/dashboard/io/leaderboard", label: "Leaderboard",desc: "IO rankings" },
          { href: "/dashboard/io/body",        label: "Body",       desc: "Weight + PRs" },
        ].map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-[#111318] border border-[#1e2130] hover:border-violet-500/30 rounded-xl p-4 transition-colors group"
          >
            <p className="font-semibold text-sm text-[#f0f2f8] group-hover:text-violet-300 transition-colors">{label}</p>
            <p className="text-xs text-[#6b7280] mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
