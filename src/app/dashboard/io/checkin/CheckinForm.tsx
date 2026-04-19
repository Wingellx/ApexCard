"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitCheckin } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Dumbbell, Briefcase, Target, Brain, Star } from "lucide-react";

interface Existing {
  workout_completed: boolean;
  work_units: number;
  goal_completed: boolean;
  focus_rating: number;
  accomplishment: string | null;
}

interface Props {
  pref: "daily" | "weekly";
  existing: Existing | null;
}

function YesNo({
  label, icon, name, value, onChange,
}: {
  label: string; icon: React.ReactNode; name: string;
  value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#6b7280]">{icon}</span>
        <p className="text-sm font-semibold text-[#f0f2f8]">{label}</p>
      </div>
      <input type="hidden" name={name} value={value ? "yes" : "no"} />
      <div className="flex gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg border transition-colors",
              value === v
                ? v ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    : "bg-rose-500/15 border-rose-500/40 text-rose-400"
                : "bg-[#0d0f15] border-[#1e2130] text-[#6b7280] hover:border-[#2a2f45]"
            )}
          >
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

function FocusSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const color = value >= 8 ? "text-emerald-400" : value >= 5 ? "text-amber-400" : "text-rose-400";
  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#6b7280]" />
          <p className="text-sm font-semibold text-[#f0f2f8]">Rate your execution intensity</p>
        </div>
        <span className={`text-xl font-extrabold tabular-nums ${color}`}>{value}<span className="text-xs text-[#6b7280] font-normal">/10</span></span>
      </div>
      <input
        type="range"
        name="focus_rating"
        min="1" max="10" step="1"
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-white"
      />
      <div className="flex justify-between text-[10px] text-[#374151] mt-1">
        <span>1 Distracted</span>
        <span>10 Locked in</span>
      </div>
    </div>
  );
}

export default function CheckinForm({ pref, existing }: Props) {
  const [state, formAction, isPending] = useActionState(submitCheckin, null);
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const [workout,       setWorkout]       = useState(existing?.workout_completed ?? false);
  const [workUnits,     setWorkUnits]     = useState(String(existing?.work_units ?? ""));
  const [goal,          setGoal]          = useState(existing?.goal_completed    ?? false);
  const [focus,         setFocus]         = useState(existing?.focus_rating      ?? 7);
  const [accomplishment,setAccomplishment]= useState(existing?.accomplishment    ?? "");

  useEffect(() => {
    if (state?.success) {
      success("Debrief saved!");
      router.push("/dashboard/io");
    }
    if (state?.error) toastError(state.error);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const workLabel = pref === "daily" ? "Calls logged today" : "Total calls this week";

  return (
    <form action={formAction} className="space-y-4">
      <YesNo
        label="Did you complete your workout?"
        icon={<Dumbbell className="w-4 h-4" />}
        name="workout_completed"
        value={workout}
        onChange={setWorkout}
      />

      <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-[#6b7280]" />
          <p className="text-sm font-semibold text-[#f0f2f8]">{workLabel}</p>
          <span className="text-[10px] text-[#374151] ml-auto">max 25 pts at {pref === "daily" ? "15+" : "75+"}</span>
        </div>
        <input
          type="number"
          name="work_units"
          min="0"
          value={workUnits}
          onChange={e => setWorkUnits(e.target.value)}
          placeholder={pref === "daily" ? "e.g. 12" : "e.g. 60"}
          className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors"
        />
      </div>

      <YesNo
        label={`Did you complete your ${pref === "daily" ? "daily" : "weekly"} mission?`}
        icon={<Target className="w-4 h-4" />}
        name="goal_completed"
        value={goal}
        onChange={setGoal}
      />

      <FocusSlider value={focus} onChange={setFocus} />

      <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-[#6b7280]" />
          <p className="text-sm font-semibold text-[#f0f2f8]">What did you execute on today?</p>
          <span className="text-[10px] text-[#374151] ml-auto">optional</span>
        </div>
        <textarea
          name="accomplishment"
          value={accomplishment}
          onChange={e => setAccomplishment(e.target.value)}
          placeholder={`e.g. "Closed a $5k deal on a cold call"`}
          rows={2}
          className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-colors resize-none"
        />
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-400">{state.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-white/90 disabled:opacity-50 text-black font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-white/10"
      >
        {isPending ? "Saving…" : (
          <><CheckCircle2 className="w-4 h-4" /> {existing ? "Update debrief" : "Submit debrief"}</>
        )}
      </button>
    </form>
  );
}
