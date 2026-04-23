"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { logClosedCall } from "@/app/dashboard/crm/actions";
import Button from "@/components/ui/Button";

const inputCls =
  "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-2.5 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";
const labelCls =
  "block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5";

interface Props {
  defaultCommissionPct: number;
}

export default function ClosedCallForm({ defaultCommissionPct }: Props) {
  const [state, formAction, isPending] = useActionState(logClosedCall, null);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-[#f0f2f8] mb-5">Log a Closed Call</h2>

      {state?.success && (
        <div className="flex items-center gap-2 mb-4 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Logged successfully.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Lead Name</label>
            <input
              name="lead_name"
              type="text"
              required
              placeholder="e.g. John Smith"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Closer Name</label>
            <input
              name="closer_name"
              type="text"
              placeholder="Optional"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Closed Amount ($)</label>
            <input
              name="closed_amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Commission %</label>
            <input
              name="commission_pct"
              type="number"
              min="0"
              max="100"
              step="0.1"
              defaultValue={String(defaultCommissionPct)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Date Closed</label>
            <input
              name="date_closed"
              type="date"
              defaultValue={today}
              required
              className={inputCls}
            />
          </div>
        </div>

        {state?.error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
            <p className="text-xs text-rose-400">{state.error}</p>
          </div>
        )}

        <Button type="submit" size="md" loading={isPending}>
          Log call
        </Button>
      </form>
    </div>
  );
}
