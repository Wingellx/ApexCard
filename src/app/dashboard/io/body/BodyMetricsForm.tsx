"use client";

import { useActionState, useState, useEffect } from "react";
import { saveBodyMetrics } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";
import { CheckCircle2, XCircle, Plus } from "lucide-react";

interface Props {
  prNames: string[];
  latest: { pr1_name?: string | null; pr2_name?: string | null; pr3_name?: string | null } | null;
}

function today() { return new Date().toISOString().split("T")[0]; }

const inputClass = "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2.5 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors";
const labelClass = "block text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1";

export default function BodyMetricsForm({ prNames, latest }: Props) {
  const [state, formAction, isPending] = useActionState(saveBodyMetrics, null);
  const { success, error } = useToast();
  const [pr1Name, setPr1Name] = useState(latest?.pr1_name ?? prNames[0] ?? "");
  const [pr2Name, setPr2Name] = useState(latest?.pr2_name ?? prNames[1] ?? "");
  const [pr3Name, setPr3Name] = useState(latest?.pr3_name ?? prNames[2] ?? "");

  useEffect(() => {
    if (state && !state.error) success("Body metrics saved.");
    if (state?.error)          error(state.error);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Plus className="w-4 h-4 text-violet-400" />
        <p className="text-sm font-semibold text-[#f0f2f8]">Log today&apos;s metrics</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" name="log_date" defaultValue={today()} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Weight (lbs)</label>
            <input type="number" name="weight_lbs" step="0.1" min="0" placeholder="175.5" className={inputClass} />
          </div>
        </div>

        <div className="pt-2 border-t border-[#1e2130]">
          <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider mb-3">Custom PRs (up to 3)</p>
          <div className="space-y-3">
            {[
              { idx: 1, name: pr1Name, setName: setPr1Name },
              { idx: 2, name: pr2Name, setName: setPr2Name },
              { idx: 3, name: pr3Name, setName: setPr3Name },
            ].map(({ idx, name, setName }) => (
              <div key={idx} className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>PR {idx} name</label>
                  <input
                    type="text"
                    name={`pr${idx}_name`}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={idx === 1 ? "Bench Press" : idx === 2 ? "Squat" : "Deadlift"}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Weight (lbs)</label>
                  <input
                    type="number"
                    name={`pr${idx}_value`}
                    step="2.5"
                    min="0"
                    placeholder="225"
                    disabled={!name.trim()}
                    className={inputClass + (!name.trim() ? " opacity-40 cursor-not-allowed" : "")}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {state?.error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-400">{state.error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {isPending ? "Saving…" : <><CheckCircle2 className="w-4 h-4" /> Save metrics</>}
          </button>
        </div>
      </form>
    </div>
  );
}
