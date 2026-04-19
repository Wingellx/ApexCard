"use client";

import { useActionState, useState } from "react";
import { saveTrainingSplit } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const PRESETS = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Cardio", "Rest"];

interface Props {
  split: Record<number, string>;
  dayLabels: string[];
}

export default function TrainingSplitEditor({ split, dayLabels }: Props) {
  const [state, formAction, isPending] = useActionState(saveTrainingSplit, null);
  const { success, error } = useToast();
  const [sessions, setSessions] = useState<string[]>(
    Array.from({ length: 7 }, (_, i) => split[i + 1] ?? (i === 3 || i === 6 ? "Rest" : ""))
  );

  useEffect(() => {
    if (state && !state.error) success("Training split saved.");
    if (state?.error)          error(state.error);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const inputClass = "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors";

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dayLabels.map((day, i) => {
          const dow = i + 1;
          const isRest = sessions[i]?.trim().toLowerCase() === "rest" || sessions[i] === "";
          return (
            <div key={day} className="flex items-center gap-3">
              <span className={cn(
                "text-xs font-semibold w-20 shrink-0",
                isRest ? "text-[#374151]" : "text-[#9ca3af]"
              )}>
                {day}
              </span>
              <input
                type="text"
                name={`day_${dow}`}
                value={sessions[i]}
                onChange={e => setSessions(prev => { const n=[...prev]; n[i]=e.target.value; return n; })}
                placeholder="Rest"
                list="session-presets"
                className={inputClass}
              />
            </div>
          );
        })}
      </div>

      <datalist id="session-presets">
        {PRESETS.map(p => <option key={p} value={p} />)}
      </datalist>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[#4b5563]">Tip: type &ldquo;Rest&rdquo; for off days</p>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {isPending ? "Saving…" : <><CheckCircle2 className="w-4 h-4" /> Save split</>}
        </button>
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-400">{state.error}</p>
        </div>
      )}
    </form>
  );
}
