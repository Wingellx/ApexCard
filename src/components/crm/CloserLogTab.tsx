"use client";

import { useState } from "react";
import { Settings, X, ChevronDown, ChevronUp } from "lucide-react";
import type { CrmFieldDef, LogValueMap, CrmCustomLog } from "@/lib/closer-crm-queries";
import CloserDailyLogForm from "./CloserDailyLogForm";
import CloserFieldBuilder from "./CloserFieldBuilder";
import CloserHistory from "./CloserHistory";

interface Props {
  fields: CrmFieldDef[];
  todayValues: LogValueMap;
  history: CrmCustomLog[];
}

export default function CloserLogTab({ fields, todayValues, history }: Props) {
  const [builderOpen, setBuilderOpen] = useState(false);

  return (
    <div className="space-y-6">

      {/* Header row with Customise Fields button */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest">Daily Log</p>
        <button
          type="button"
          onClick={() => setBuilderOpen(o => !o)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6b7280] hover:text-[#9ca3af] bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Customise Fields
          {builderOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Field builder panel */}
      {builderOpen && (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#f0f2f8]">CRM Fields</p>
            <button
              type="button"
              onClick={() => setBuilderOpen(false)}
              className="text-[#4b5563] hover:text-[#9ca3af] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <CloserFieldBuilder initialFields={fields} />
        </div>
      )}

      {/* Daily log form */}
      <CloserDailyLogForm
        fields={fields}
        todayValues={todayValues}
        onOpenBuilder={() => setBuilderOpen(true)}
      />

      {/* History */}
      <CloserHistory fields={fields} history={history} />
    </div>
  );
}
