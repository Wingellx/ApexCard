import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTrainingSplit, getGymStreak, getRecentCheckins } from "@/lib/io-queries";
import { DAY_LABELS, DAY_FULL, todayDayOfWeek } from "@/lib/io-score";
import TrainingSplitEditor from "./TrainingSplitEditor";
import { Flame, Dumbbell } from "lucide-react";

// Get the dates for the current Mon–Sun week
function getWeekDates(): string[] {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

const REST_SESSIONS = ["Rest", "rest", "OFF", "off", ""];
function isRest(name: string) { return REST_SESSIONS.some(r => r === name.trim()); }

export default async function TrainingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const weekDates = getWeekDates();
  const todayDOW  = todayDayOfWeek(); // 1=Mon…7=Sun

  const [split, gymStreak, recentCheckins] = await Promise.all([
    getTrainingSplit(user.id),
    getGymStreak(user.id),
    getRecentCheckins(user.id, 14),
  ]);

  // Map date → workout_completed
  const completedDates = new Set(
    recentCheckins.filter(c => c.workout_completed).map(c => c.checkin_date)
  );

  const DEFAULT_SESSIONS = ["Push", "Pull", "Legs", "Rest", "Upper", "Lower", "Rest"];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px] space-y-6">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Training Split</h1>
          <p className="text-sm text-[#6b7280] mt-1">Your weekly schedule and completion log.</p>
        </div>
        {gymStreak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/[0.07] border border-orange-500/[0.12] rounded-lg">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-orange-300">{gymStreak} day gym streak</span>
          </div>
        )}
      </div>

      {/* Weekly calendar */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const dow       = i + 1; // 1=Mon
          const session   = split[dow] ?? DEFAULT_SESSIONS[i];
          const isToday   = dow === todayDOW;
          const isRestDay = isRest(session);
          const done      = completedDates.has(date);

          return (
            <div
              key={date}
              className={`rounded-xl border p-2 sm:p-3 flex flex-col items-center gap-1.5 transition-colors ${
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
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                done && !isRestDay ? "bg-emerald-500/20" :
                isRestDay         ? "bg-[#1e2130]"       :
                                    "bg-indigo-500/10"
              }`}>
                {done && !isRestDay
                  ? <span className="text-emerald-400 text-sm">✓</span>
                  : isRestDay
                  ? <span className="text-[#374151] text-xs">–</span>
                  : <Dumbbell className="w-4 h-4 text-indigo-400" />
                }
              </div>
              <p className={`text-[9px] font-semibold text-center leading-tight ${
                isRestDay ? "text-[#374151]" : "text-[#9ca3af]"
              }`}>
                {session || "—"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Split editor */}
      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-6">
        <p className="text-sm font-semibold text-[#f0f2f8] mb-1">Edit your split</p>
        <p className="text-xs text-[#6b7280] mb-5">Set session names for each day. Use &ldquo;Rest&rdquo; for off days.</p>
        <TrainingSplitEditor split={split} dayLabels={DAY_FULL} />
      </div>
    </div>
  );
}
