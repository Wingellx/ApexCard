import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getTodayCheckin, getGymStreak, getScoreAverages, getIOMemberCount,
  getTrainingSplit, getBodyMetrics, getRecentCheckins,
} from "@/lib/io-queries";
import { getCheckinDateKey, scoreColor, scoreLabel, DAY_LABELS, todayDayOfWeek, IO_TEAM_ID } from "@/lib/io-score";
import { getLoggedDates, calculateStreak } from "@/lib/queries";
import CheckinForm from "./checkin/CheckinForm";
import BodyMetricsForm from "./body/BodyMetricsForm";
import { Zap, Flame, Target, TrendingUp, CheckCircle2, Clock, Dumbbell, RefreshCw } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ScoreArc({ score }: { score: number }) {
  const r = 40, circ = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;
  const color = score >= 85 ? "#34d399" : score >= 65 ? "#fbbf24" : "#f87171";
  return (
    <svg width="96" height="96" viewBox="0 0 100 100" className="shrink-0">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e2130" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x="50" y="46" textAnchor="middle" fill={color} fontSize="16" fontWeight="800">{score}</text>
      <text x="50" y="60" textAnchor="middle" fill="#6b7280" fontSize="9">/100</text>
    </svg>
  );
}

function ScoreBreakdownRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#6b7280] w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%`, transition: "width 0.5s ease" }} />
      </div>
      <span className="text-xs font-bold text-[#f0f2f8] w-10 text-right tabular-nums">{value}/{max}</span>
    </div>
  );
}

function Sparkline({ data }: { data: { performance_score: number }[] }) {
  if (data.length < 2) return null;
  const vals = data.map(d => d.performance_score);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = Math.max(max - min, 1);
  const W = 120, H = 32;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-60">
      <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-3">{children}</p>
  );
}

// Week helper (Mon–Sun)
function getWeekDates(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

const REST_SESSIONS = ["rest", "off", ""];
function isRest(name: string) { return REST_SESSIONS.includes(name.trim().toLowerCase()); }

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function IODashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tracking_preference, full_name")
    .eq("id", user.id)
    .single();

  const pref      = (profile?.tracking_preference ?? "daily") as "daily" | "weekly";
  const dateKey   = getCheckinDateKey(pref);
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const weekDates = getWeekDates();
  const todayDOW  = todayDayOfWeek();

  const [
    checkin, gymStreak, salesStreak, averages, memberCount,
    trainingSplitResult, recentCheckins, bodyMetrics,
  ] = await Promise.all([
    getTodayCheckin(user.id, dateKey),
    getGymStreak(user.id),
    getLoggedDates(user.id).then(calculateStreak),
    getScoreAverages(user.id),
    getIOMemberCount(),
    getTrainingSplit(user.id),
    getRecentCheckins(user.id, 14),
    getBodyMetrics(user.id, 30),
  ]);

  const split = trainingSplitResult.split;

  const completedDates = new Set(
    recentCheckins.filter(c => c.workout_completed).map(c => c.checkin_date)
  );

  const periodLabel   = pref === "daily" ? "today" : "this week";
  const checkedIn     = !!checkin;
  const DEFAULT_SESSIONS = ["Push", "Pull", "Legs", "Rest", "Upper", "Lower", "Rest"];
  const todaySession  = split[todayDOW] ?? DEFAULT_SESSIONS[todayDOW - 1] ?? "—";
  const todayIsRest   = isRest(todaySession);

  // Body metrics
  const latest    = bodyMetrics[0] ?? null;
  const prNames   = [latest?.pr1_name, latest?.pr2_name, latest?.pr3_name].filter(Boolean) as string[];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px] space-y-8">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
            <span className="text-xs">⚔️</span>
          </div>
          <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">IO Brotherhood</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Hey, {firstName}.</h1>
        <p className="text-sm text-[#6b7280] mt-0.5">
          {memberCount} brother{memberCount !== 1 ? "s" : ""} · {pref === "daily" ? "Daily" : "Weekly"} tracker
        </p>
        <p className="text-xs text-white/30 mt-1 italic">Execute daily. Improve always. ⚔️</p>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Gym Streak",   value: gymStreak,               suffix: "days",  icon: Flame,      color: "text-orange-400" },
          { label: "Sales Streak", value: salesStreak,             suffix: "days",  icon: TrendingUp,  color: "text-indigo-400" },
          { label: "Weekly Avg",   value: averages.weekly  ?? "—", suffix: averages.weekly  ? "/100" : "", icon: Zap,    color: averages.weekly  ? scoreColor(averages.weekly  as number) : "text-[#6b7280]" },
          { label: "Monthly Avg",  value: averages.monthly ?? "—", suffix: averages.monthly ? "/100" : "", icon: Target, color: averages.monthly ? scoreColor(averages.monthly as number) : "text-[#6b7280]" },
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

      {/* ── Daily Debrief ───────────────────────────────────────────────── */}
      <div>
        <SectionLabel>
          {pref === "daily" ? "Daily" : "Weekly"} Debrief
        </SectionLabel>

        {checkedIn ? (
          <div className="space-y-4">
            {/* Score display */}
            <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-6">
              <div className="flex items-start gap-6 flex-wrap">
                <ScoreArc score={checkin.performance_score} />
                <div className="flex-1 min-w-0 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <p className="text-sm font-semibold text-[#f0f2f8] capitalize">
                        {scoreLabel(checkin.performance_score)} execution {periodLabel}
                      </p>
                    </div>
                    <p className={`text-2xl font-extrabold ${scoreColor(checkin.performance_score)}`}>
                      {checkin.performance_score}/100
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <ScoreBreakdownRow label="Execution"  value={checkin.score_accountability} max={40} color="bg-white"       />
                    <ScoreBreakdownRow label="Fitness"    value={checkin.score_fitness}        max={35} color="bg-emerald-500" />
                    <ScoreBreakdownRow label="Work/Sales" value={checkin.score_work}           max={25} color="bg-indigo-500"  />
                  </div>
                </div>
              </div>
              {checkin.accomplishment && (
                <div className="mt-5 pt-5 border-t border-[#1e2130]">
                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1">Executed on</p>
                  <p className="text-sm text-[#9ca3af] italic">&ldquo;{checkin.accomplishment}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Update form */}
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#6b7280] hover:text-white transition-colors list-none select-none mb-3">
                <RefreshCw className="w-3.5 h-3.5" />
                Update debrief
                <span className="group-open:hidden">▸</span>
                <span className="hidden group-open:inline">▾</span>
              </summary>
              <CheckinForm pref={pref} existing={checkin} />
            </details>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#111318] border border-dashed border-[#1e2130] rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#f0f2f8]">No debrief {periodLabel}</p>
                <p className="text-xs text-[#6b7280]">Log your workout, work, and execution below.</p>
              </div>
            </div>
            <CheckinForm pref={pref} existing={null} />
          </div>
        )}
      </div>

      {/* ── Training Calendar ───────────────────────────────────────────── */}
      <div>
        <SectionLabel>Training This Week</SectionLabel>

        {/* Today's session callout */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border mb-4 ${todayIsRest ? "border-[#1e2130] bg-[#111318]" : "border-violet-500/30 bg-violet-500/5"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${todayIsRest ? "bg-[#1e2130]" : "bg-violet-500/15"}`}>
            {todayIsRest
              ? <span className="text-[#374151] text-sm">–</span>
              : <Dumbbell className="w-5 h-5 text-violet-400" />}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Today&apos;s session</p>
            <p className={`text-sm font-bold ${todayIsRest ? "text-[#374151]" : "text-[#f0f2f8]"}`}>
              {todayIsRest ? "Rest Day" : todaySession}
            </p>
          </div>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekDates.map((date, i) => {
            const dow       = i + 1;
            const session   = split[dow] ?? DEFAULT_SESSIONS[i];
            const isToday   = dow === todayDOW;
            const isRestDay = isRest(session);
            const done      = completedDates.has(date);

            return (
              <div
                key={date}
                className={`rounded-xl border p-2 flex flex-col items-center gap-1.5 transition-colors ${
                  isToday
                    ? "border-violet-500/50 bg-violet-500/5"
                    : done && !isRestDay
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-[#1e2130] bg-[#111318]"
                }`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? "text-violet-400" : "text-[#6b7280]"}`}>
                  {DAY_LABELS[i]}
                </p>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  done && !isRestDay ? "bg-emerald-500/20" :
                  isRestDay         ? "bg-[#1e2130]"       :
                                      "bg-indigo-500/10"
                }`}>
                  {done && !isRestDay
                    ? <span className="text-emerald-400 text-xs">✓</span>
                    : isRestDay
                    ? <span className="text-[#374151] text-[10px]">–</span>
                    : <Dumbbell className="w-3.5 h-3.5 text-indigo-400" />
                  }
                </div>
                <p className={`text-[9px] font-semibold text-center leading-tight truncate w-full text-center ${isRestDay ? "text-[#374151]" : "text-[#9ca3af]"}`}>
                  {session || "—"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Execution trend ─────────────────────────────────────────────── */}
      {averages.history.length >= 2 && (
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-0.5">Execution trend</p>
            <p className="text-sm text-[#9ca3af]">Last {averages.history.length} debriefs</p>
          </div>
          <Sparkline data={averages.history} />
        </div>
      )}

      {/* ── Body Metrics ────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Body Metrics</SectionLabel>

        {latest && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {latest.weight_lbs != null && (
              <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-4">
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Weight</p>
                <p className="text-xl font-extrabold text-violet-400 tabular-nums">{latest.weight_lbs}<span className="text-xs font-normal text-[#6b7280] ml-1">lbs</span></p>
                <p className="text-[10px] text-[#374151] mt-0.5">{latest.log_date}</p>
              </div>
            )}
            {[
              { name: latest.pr1_name, val: latest.pr1_value },
              { name: latest.pr2_name, val: latest.pr2_value },
              { name: latest.pr3_name, val: latest.pr3_value },
            ].filter(pr => pr.name && pr.val != null).map(pr => (
              <div key={pr.name} className="bg-[#111318] border border-[#1e2130] rounded-xl p-4">
                <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1 truncate">{pr.name}</p>
                <p className="text-xl font-extrabold text-emerald-400 tabular-nums">{pr.val}<span className="text-xs font-normal text-[#6b7280] ml-1">lbs</span></p>
                <p className="text-[10px] text-[#374151] mt-0.5">{latest.log_date}</p>
              </div>
            ))}
          </div>
        )}

        <BodyMetricsForm prNames={prNames} latest={latest} />
      </div>

    </div>
  );
}
