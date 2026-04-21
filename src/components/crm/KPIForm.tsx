"use client";

import { useActionState, useState } from "react";
import { Target, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { saveKPIs } from "@/app/dashboard/crm/manager/actions";
import Button from "@/components/ui/Button";
import type { CRMKpi } from "@/lib/crm-queries";

const inputCls =
  "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-center";
const labelCls =
  "block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5 text-center";

const FIELDS: { key: string; label: string; decimal?: boolean }[] = [
  { key: "outbound_target", label: "Outbound"   },
  { key: "followup_target", label: "Follow-ups" },
  { key: "pitched_target",  label: "Pitched"    },
  { key: "booked_target",   label: "Booked"     },
  { key: "replied_target",  label: "Replied"    },
  { key: "hours_target",    label: "Hours", decimal: true },
];

interface Props { kpi: CRMKpi | null }

export default function KPIForm({ kpi }: Props) {
  const [state, formAction, isPending] = useActionState(saveKPIs, null);
  const [open, setOpen] = useState(!kpi);

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Target className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-[#f0f2f8]">Daily KPI Targets</span>
          {kpi && (
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Set
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#4b5563]" /> : <ChevronDown className="w-4 h-4 text-[#4b5563]" />}
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-[#1e2130]">
          <p className="text-xs text-[#4b5563] mt-4 mb-5 leading-relaxed">
            Set daily targets for your team. Hitting a target scores 1.0×; exceeding it scales up to 2.0× — so booking 6 calls against a target of 3 earns a 1.5× multiplier on that metric.
          </p>

          {state?.success && (
            <div className="flex items-center gap-2 mb-4 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" /> KPIs saved.
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input
                    name={f.key}
                    type="number"
                    min="0"
                    step={f.decimal ? "0.5" : "1"}
                    defaultValue={kpi ? String((kpi as Record<string, unknown>)[f.key] ?? 0) : "0"}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            {state?.error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
                <p className="text-xs text-rose-400">{state.error}</p>
              </div>
            )}

            <Button type="submit" size="md" loading={isPending}>
              {kpi ? "Update KPIs" : "Save KPIs"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

