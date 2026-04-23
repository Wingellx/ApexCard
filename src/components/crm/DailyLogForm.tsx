"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { upsertDailyLog } from "@/app/dashboard/crm/actions";
import Button from "@/components/ui/Button";
import type { DailyLog, CRMKpi } from "@/lib/crm-queries";

const inputCls =
  "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-2.5 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-center";
const labelCls =
  "block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5 text-center";

const FIELDS: { key: keyof DailyLog; label: string; decimal?: boolean }[] = [
  { key: "outbound_messages", label: "Outbounds Sent"    },
  { key: "followup_messages", label: "Follow-ups Sent"   },
  { key: "calls_pitched",     label: "Call Pitched"      },
  { key: "calls_booked",      label: "Call Booked"       },
  { key: "replied",           label: "Replied"           },
  { key: "hours_worked",      label: "Hours Worked", decimal: true },
];

const KPI_TARGET_KEY: Record<string, keyof CRMKpi> = {
  outbound_messages: "outbound_target",
  followup_messages: "followup_target",
  calls_pitched:     "pitched_target",
  calls_booked:      "booked_target",
  replied:           "replied_target",
  hours_worked:      "hours_target",
};

interface Props {
  today: DailyLog | null;
  kpi:   CRMKpi | null;
}

export default function DailyLogForm({ today, kpi }: Props) {
  const [state, formAction, isPending] = useActionState(upsertDailyLog, null);
  const date = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-[#f0f2f8]">
          {today ? "Update today's log" : "Log today's activity"}
        </h2>
        <span className="text-xs text-[#4b5563]">{date}</span>
      </div>

      {state?.success && (
        <div className="flex items-center gap-2 mb-4 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Saved.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="log_date" value={date} />

        {[FIELDS.slice(0, 4), FIELDS.slice(4)].map((group, gi) => (
          <div key={gi} className={`grid gap-3 ${gi === 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
            {group.map(f => {
              const target = kpi ? Number(kpi[KPI_TARGET_KEY[f.key]] ?? 0) : 0;
              return (
                <div key={f.key}>
                  <label className={labelCls}>
                    {f.label}
                    {target > 0 && <span className="ml-1 text-indigo-400/60">/{target}</span>}
                  </label>
                  <input
                    name={f.key}
                    type="number"
                    min="0"
                    step={f.decimal ? "0.5" : "1"}
                    defaultValue={today ? String(today[f.key] ?? 0) : "0"}
                    className={inputCls}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {state?.error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
            <p className="text-xs text-rose-400">{state.error}</p>
          </div>
        )}

        <Button type="submit" size="md" loading={isPending}>
          {today ? "Update" : "Save log"}
        </Button>
      </form>
    </div>
  );
}
