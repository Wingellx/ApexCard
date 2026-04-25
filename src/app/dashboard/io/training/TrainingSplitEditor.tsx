"use client";

import { useState, useTransition } from "react";
import { saveTrainingDay } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingExercise } from "@/lib/io-queries";

const PRESETS = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Cardio", "Rest"];

interface Exercise {
  uid: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

interface DayState {
  sessionName: string;
  exercises: Exercise[];
  open: boolean;
}

interface Props {
  split: Record<number, string>;
  exercises: Record<number, TrainingExercise[]>;
  dayLabels: string[];
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function TrainingSplitEditor({ split, exercises, dayLabels }: Props) {
  const { success, error } = useToast();
  const [isPending, startTransition] = useTransition();
  const [savingDay, setSavingDay] = useState<number | null>(null);

  const [days, setDays] = useState<DayState[]>(() =>
    Array.from({ length: 7 }, (_, i) => {
      const dow = i + 1;
      return {
        sessionName: split[dow] ?? (i === 3 || i === 6 ? "Rest" : ""),
        exercises: (exercises[dow] ?? []).map(e => ({
          uid:    uid(),
          name:   e.exercise_name,
          sets:   e.sets != null ? String(e.sets) : "",
          reps:   e.reps ?? "",
          weight: e.weight ?? "",
        })),
        open: false,
      };
    })
  );

  function updateDay(i: number, patch: Partial<DayState>) {
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  }

  function addExercise(i: number) {
    setDays(prev => prev.map((d, idx) =>
      idx === i ? { ...d, exercises: [...d.exercises, { uid: uid(), name: "", sets: "", reps: "", weight: "" }] } : d
    ));
  }

  function removeExercise(dayIdx: number, exUid: string) {
    setDays(prev => prev.map((d, idx) =>
      idx === dayIdx ? { ...d, exercises: d.exercises.filter(e => e.uid !== exUid) } : d
    ));
  }

  function updateExercise(dayIdx: number, exUid: string, field: keyof Omit<Exercise, "uid">, value: string) {
    setDays(prev => prev.map((d, idx) =>
      idx === dayIdx
        ? { ...d, exercises: d.exercises.map(e => e.uid === exUid ? { ...e, [field]: value } : e) }
        : d
    ));
  }

  function saveDay(i: number) {
    const dow = i + 1;
    const day = days[i];
    setSavingDay(dow);
    startTransition(async () => {
      const result = await saveTrainingDay(
        dow,
        day.sessionName,
        day.exercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, weight: e.weight }))
      );
      setSavingDay(null);
      if (result.error) error(result.error);
      else success(`${dayLabels[i]} saved.`);
    });
  }

  const inp = "bg-[#0d0f15] border border-[#1e2130] rounded-lg px-2.5 py-2 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-colors";

  return (
    <div className="space-y-2">
      {dayLabels.map((label, i) => {
        const dow = i + 1;
        const day = days[i];
        const isRest = day.sessionName.trim().toLowerCase() === "rest" || day.sessionName.trim() === "";
        const isSaving = savingDay === dow && isPending;

        return (
          <div key={label} className="bg-[#0d0f15] border border-[#1e2130] rounded-2xl overflow-hidden">
            {/* Collapsed header */}
            <button
              type="button"
              onClick={() => updateDay(i, { open: !day.open })}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
            >
              <span className="text-xs font-bold text-[#4b5563] w-24 shrink-0">{label}</span>
              {day.sessionName.trim() ? (
                <span className={cn(
                  "text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                  isRest
                    ? "bg-[#1e2130] text-[#4b5563]"
                    : "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                )}>
                  {day.sessionName}
                </span>
              ) : (
                <span className="text-[11px] text-[#2d3147]">Not set</span>
              )}
              {!isRest && day.exercises.length > 0 && (
                <span className="text-[10px] text-[#374151] ml-1">
                  · {day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}
                </span>
              )}
              <span className="ml-auto text-[#2d3147]">
                {day.open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </button>

            {/* Expanded editor */}
            {day.open && (
              <div className="border-t border-[#1e2130] px-4 py-4 space-y-5">
                {/* Session name */}
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-bold text-[#4b5563] uppercase tracking-widest w-20 shrink-0">
                    Session
                  </label>
                  <input
                    type="text"
                    value={day.sessionName}
                    onChange={e => updateDay(i, { sessionName: e.target.value })}
                    placeholder="e.g. Push, Rest"
                    list="session-presets"
                    className={cn(inp, "flex-1 max-w-xs")}
                  />
                </div>

                {/* Exercises — only shown when not a rest day */}
                {!isRest && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-[#4b5563] uppercase tracking-widest">Exercises</p>

                    {day.exercises.length > 0 && (
                      <div className="space-y-1.5">
                        {/* Column headers */}
                        <div className="grid gap-2 px-0.5" style={{ gridTemplateColumns: "1fr 52px 76px 80px 32px" }}>
                          {["Exercise", "Sets", "Reps", "Weight", ""].map((h, hi) => (
                            <span key={hi} className="text-[9px] font-bold text-[#2d3147] uppercase tracking-widest">{h}</span>
                          ))}
                        </div>
                        {/* Exercise rows */}
                        {day.exercises.map(ex => (
                          <div key={ex.uid} className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 52px 76px 80px 32px" }}>
                            <input
                              type="text"
                              value={ex.name}
                              onChange={e => updateExercise(i, ex.uid, "name", e.target.value)}
                              placeholder="Bench Press"
                              className={inp}
                            />
                            <input
                              type="text"
                              value={ex.sets}
                              onChange={e => updateExercise(i, ex.uid, "sets", e.target.value)}
                              placeholder="4"
                              className={cn(inp, "text-center px-2")}
                            />
                            <input
                              type="text"
                              value={ex.reps}
                              onChange={e => updateExercise(i, ex.uid, "reps", e.target.value)}
                              placeholder="8-10"
                              className={inp}
                            />
                            <input
                              type="text"
                              value={ex.weight}
                              onChange={e => updateExercise(i, ex.uid, "weight", e.target.value)}
                              placeholder="60kg"
                              className={inp}
                            />
                            <button
                              type="button"
                              onClick={() => removeExercise(i, ex.uid)}
                              className="w-8 h-8 flex items-center justify-center text-[#2d3147] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => addExercise(i)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#4b5563] hover:text-violet-400 hover:bg-violet-500/5 px-2 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add exercise
                    </button>
                  </div>
                )}

                {/* Save */}
                <div className="flex justify-end pt-1 border-t border-[#1e2130]">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => saveDay(i)}
                    className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors mt-3"
                  >
                    {isSaving ? "Saving…" : <><CheckCircle2 className="w-3.5 h-3.5" /> Save {label}</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <datalist id="session-presets">
        {PRESETS.map(p => <option key={p} value={p} />)}
      </datalist>
    </div>
  );
}
