import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserTeam } from "@/lib/queries";
import { getTrainingSplit, getGymStreak, getRecentCheckins } from "@/lib/io-queries";
import { DAY_LABELS, todayDayOfWeek } from "@/lib/io-score";
import { Flame, Dumbbell, Lock } from "lucide-react";

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

const REST = ["rest", "off", ""];
function isRest(s: string) { return REST.includes(s.trim().toLowerCase()); }

export default async function TeamTrainingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const userTeam = await getUserTeam(user.id);
  if (!userTeam) redirect("/dashboard");

  const weekDates = getWeekDates();
  const todayDOW  = todayDayOfWeek();

  const [{ split, isAdminAssigned }, gymStreak, recentCheckins] = await Promise.all([
    getTrainingSplit(user.id),
    getGymStreak(user.id),
    getRecentCheckins(user.id, 14),
  ]);

  const completedDates = new Set(
    recentCheckins.filter(c => c.workout_completed).map(c => c.checkin_date)
  );

  const hasSplit = Object.keys(split).length > 0;
  const DEFAULT_SESSIONS = ["Push", "Pull", "Legs", "Rest", "Upper", "Lower", "Rest"];
  const todaySession = split[todayDOW] ?? null;
  const todayIsRest  = todaySession ? isRest(todaySession) : false;

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px] space-y-6">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Training Split</h1>
          <p className="text-sm text-[#6b7280] mt-1">{userTeam.team.name} · your weekly schedule</p>
        </div>
        <div className="flex items-center gap-3">
          {gymStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/[0.07] border border-orange-500/[0.12] rounded-lg">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-300">{gymStreak}d streak</span>
            </div>
          )}
          {isAdminAssigned && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-violet-500/[0.07] border border-violet-500/[0.15] rounded-lg">
              <Lock className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-violet-400">Coach assigned</span>
            </div>
          )}
        </div>
      </div>

      {!hasSplit ? (
        <div className="bg-[#111318] border border-dashed border-[#1e2130] rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Dumbbell className="w-6 h-6 text-white/20" />
          </div>
          <p className="font-semibold text-[#f0f2f8] mb-1">No split assigned yet</p>
          <p className="text-sm text-[#6b7280]">Your coach hasn&apos;t set your split yet.</p>
        </div>
      ) : (
        <>
          {/* Today's session */}
          {todaySession && (
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${todayIsRest ? "border-[#1e2130] bg-[#111318]" : "border-violet-500/30 bg-violet-500/5"}`}>
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
          )}

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
                  <p className={`text-[9px] font-semibold text-center leading-tight w-full truncate text-center ${isRestDay ? "text-[#374151]" : "text-[#9ca3af]"}`}>
                    {session || "—"}
                  </p>
                </div>
              );
            })}
          </div>

          {isAdminAssigned && (
            <p className="text-xs text-[#4b5563] text-center">This split was assigned by your coach.</p>
          )}
        </>
      )}
    </div>
  );
}
