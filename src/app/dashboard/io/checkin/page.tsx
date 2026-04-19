import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTodayCheckin } from "@/lib/io-queries";
import { getCheckinDateKey, scoreColor } from "@/lib/io-score";
import CheckinForm from "./CheckinForm";
import { CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";

export default async function CheckinPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tracking_preference")
    .eq("id", user.id)
    .single();

  const pref    = (profile?.tracking_preference ?? "daily") as "daily" | "weekly";
  const dateKey = getCheckinDateKey(pref);
  const existing = await getTodayCheckin(user.id, dateKey);

  const periodLabel = pref === "daily" ? "today" : "this week";

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[640px]">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight capitalize">
          {pref === "daily" ? "Daily" : "Weekly"} Debrief
        </h1>
        <p className="text-sm text-[#6b7280] mt-1">
          {existing ? `You've already debriefed ${periodLabel}. Update anytime.` : `Log your execution for ${periodLabel}.`}
        </p>
      </div>

      {existing && (
        <div className={`mb-5 flex items-center gap-4 p-4 rounded-xl border ${scoreColor(existing.performance_score) === "text-emerald-400" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
          <CheckCircle2 className={`w-5 h-5 shrink-0 ${scoreColor(existing.performance_score)}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#f0f2f8]">
              Score: <span className={scoreColor(existing.performance_score)}>{existing.performance_score}/100</span>
            </p>
            <p className="text-xs text-[#6b7280]">Checked in {periodLabel} · tap below to update</p>
          </div>
          <RefreshCw className="w-4 h-4 text-[#6b7280]" />
        </div>
      )}

      <CheckinForm pref={pref} existing={existing} />
    </div>
  );
}
