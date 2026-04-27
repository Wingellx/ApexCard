"use client";

import { useState } from "react";
import { Loader2, PhoneCall, MessageSquare, Sliders, Check } from "lucide-react";
import { CRM_TEMPLATES, type TemplateKey } from "@/lib/crm-templates";
import { applyTemplate } from "@/app/dashboard/crm/closer-field-actions";
import type { CrmFieldDef } from "@/lib/closer-crm-queries";

interface Props {
  onSelect: (fields: CrmFieldDef[], openEdit: boolean) => void;
}

const ICONS = {
  closer: PhoneCall,
  setter: MessageSquare,
};

const COLORS = {
  closer: { border: "border-indigo-500/30", bg: "bg-indigo-500/5", hover: "hover:border-indigo-500/60 hover:bg-indigo-500/10", dot: "bg-indigo-400", badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20" },
  setter: { border: "border-violet-500/30", bg: "bg-violet-500/5", hover: "hover:border-violet-500/60 hover:bg-violet-500/10", dot: "bg-violet-400", badge: "bg-violet-500/15 text-violet-300 border-violet-500/20" },
};

export default function CloserTemplateSelect({ onSelect }: Props) {
  const [loading, setLoading] = useState<TemplateKey | "custom" | null>(null);

  async function handleTemplate(key: TemplateKey) {
    setLoading(key);
    const result = await applyTemplate(key);
    setLoading(null);
    if (result.error) return; // silent — stays on screen
    onSelect(result.fields ?? [], false);
  }

  function handleCustom() {
    setLoading("custom");
    onSelect([], true);
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Set up your CRM</h2>
        <p className="text-sm text-[#6b7280]">Choose a template to get started, or build your own from scratch.</p>
      </div>

      <div className="space-y-3">
        {(["closer", "setter"] as TemplateKey[]).map(key => {
          const tpl    = CRM_TEMPLATES[key];
          const color  = COLORS[key];
          const Icon   = ICONS[key];
          const active = loading === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => !loading && handleTemplate(key)}
              disabled={!!loading}
              className={`w-full text-left border rounded-2xl p-5 transition-all duration-150 disabled:opacity-60
                ${color.border} ${color.bg} ${color.hover}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color.badge} border`}>
                  {active
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-[#f0f2f8]">{tpl.label}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${color.badge}`}>Template</span>
                  </div>
                  <p className="text-xs text-[#6b7280] mb-3">{tpl.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tpl.fieldLabels.map(fl => (
                      <span key={fl} className="inline-flex items-center gap-1 text-[11px] text-[#9ca3af] bg-white/[0.04] border border-white/[0.06] rounded-md px-2 py-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                        {fl}
                      </span>
                    ))}
                  </div>
                </div>
                <Check className={`w-4 h-4 shrink-0 mt-0.5 transition-opacity ${active ? "opacity-100 text-emerald-400" : "opacity-0"}`} />
              </div>
            </button>
          );
        })}

        {/* Custom */}
        <button
          type="button"
          onClick={handleCustom}
          disabled={!!loading}
          className="w-full text-left border border-[#1e2130] bg-[#0d0f15] hover:border-[#2a2f45] hover:bg-[#111318] rounded-2xl p-5 transition-all duration-150 disabled:opacity-60"
        >
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#1e2130] border border-[#2a2f45]">
              {loading === "custom"
                ? <Loader2 className="w-4 h-4 animate-spin text-[#6b7280]" />
                : <Sliders className="w-4 h-4 text-[#6b7280]" />}
            </div>
            <div>
              <p className="text-sm font-bold text-[#f0f2f8] mb-1">Custom</p>
              <p className="text-xs text-[#6b7280]">Start with a blank CRM and build your own field set.</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
