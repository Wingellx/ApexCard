"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown, ChevronUp, ExternalLink,
  Sparkles, Loader2, CheckCircle2, XCircle,
} from "lucide-react";
import type { CallRecord, AnalysisResult } from "@/lib/call-analysis-queries";

const OUTCOME_META: Record<string, { label: string; cls: string }> = {
  closed:         { label: "Closed",          cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  no_show:        { label: "No Show",         cls: "text-[#6b7280] bg-white/[0.04] border-white/[0.08]"      },
  not_interested: { label: "Not Interested",  cls: "text-rose-400 bg-rose-500/10 border-rose-500/20"         },
  follow_up:      { label: "Follow Up",       cls: "text-amber-400 bg-amber-500/10 border-amber-500/20"      },
  objection_lost: { label: "Lost on Obj.",    cls: "text-orange-400 bg-orange-500/10 border-orange-500/20"   },
};

interface Props {
  records: CallRecord[];
}

export default function CallRecordsTable({ records }: Props) {
  const router    = useRouter();
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [analysing,  setAnalysing]  = useState<string | null>(null);
  const [liveResult, setLiveResult] = useState<Record<string, AnalysisResult>>({});

  async function runAnalysis(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setAnalysing(id);
    const res = await fetch("/api/analyse-call", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ callRecordId: id }),
    });
    setAnalysing(null);
    if (res.ok) {
      const data = await res.json() as { analysis?: AnalysisResult };
      if (data.analysis) setLiveResult(prev => ({ ...prev, [id]: data.analysis! }));
      router.refresh();
    }
  }

  if (records.length === 0) {
    return (
      <p className="text-xs text-[#4b5563] py-4">
        No call records yet. Log your first call above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {records.map(record => {
        const isOpen   = expanded === record.id;
        const outcome  = OUTCOME_META[record.call_outcome] ?? { label: record.call_outcome, cls: "text-[#9ca3af] bg-white/[0.04] border-white/[0.08]" };
        const liveAR   = liveResult[record.id];
        const analysis = liveAR ?? record.analysis_result;
        const isRunning = analysing === record.id;
        const status   = liveAR ? "complete" : isRunning ? "processing" : record.analysis_status;

        return (
          <div key={record.id} className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden">

            {/* Summary row */}
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : record.id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#f0f2f8] truncate">{record.lead_name}</p>
                  <p className="text-[11px] text-[#4b5563]">{record.call_date}</p>
                </div>

                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold w-fit ${outcome.cls}`}>
                  {outcome.label}
                </span>

                <span className="text-sm text-[#9ca3af]">
                  {record.call_outcome === "closed" && record.deal_value != null
                    ? `$${Number(record.deal_value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                    : "—"}
                </span>

                <div className="flex items-center gap-2 justify-end sm:justify-start">
                  <StatusBadge status={status} />
                  {record.transcript && status === "none" && !isRunning && (
                    <button
                      type="button"
                      onClick={e => runAnalysis(record.id, e)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded px-2 py-0.5 transition-colors"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Analyse
                    </button>
                  )}
                </div>
              </div>

              {isOpen
                ? <ChevronUp   className="w-4 h-4 text-[#4b5563] shrink-0" />
                : <ChevronDown className="w-4 h-4 text-[#4b5563] shrink-0" />}
            </button>

            {/* Detail panel */}
            {isOpen && (
              <div className="border-t border-[#1e2130] px-5 pb-5 pt-4 space-y-4">

                {/* Meta row */}
                <div className="flex flex-wrap gap-4 text-xs text-[#6b7280]">
                  {record.recording_url && (
                    <a
                      href={record.recording_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Recording
                    </a>
                  )}
                  {record.notes && (
                    <p><span className="text-[#4b5563]">Notes: </span>{record.notes}</p>
                  )}
                </div>

                {/* Transcript */}
                {record.transcript && (
                  <details>
                    <summary className="text-[11px] font-semibold text-[#4b5563] cursor-pointer hover:text-[#6b7280] select-none list-none">
                      View transcript ↓
                    </summary>
                    <pre className="mt-2 text-[11px] text-[#6b7280] font-mono whitespace-pre-wrap bg-[#0d0f15] border border-[#1e2130] rounded-xl p-4 max-h-56 overflow-y-auto leading-relaxed">
                      {record.transcript}
                    </pre>
                  </details>
                )}

                {/* Analyse CTA */}
                {record.transcript && status === "none" && (
                  <button
                    type="button"
                    onClick={() => runAnalysis(record.id)}
                    disabled={!!analysing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-sm font-semibold text-indigo-300 transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Analyse Call
                  </button>
                )}

                {status === "processing" && (
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analysing with GPT-4o…
                  </div>
                )}

                {analysis && status === "complete" && (
                  <AnalysisPanel analysis={analysis} />
                )}

                {status === "failed" && (
                  <p className="text-xs text-rose-400">Analysis failed. Check transcript and try again.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "processing") return (
    <span className="flex items-center gap-1 text-[10px] text-amber-400">
      <Loader2 className="w-2.5 h-2.5 animate-spin" /> Processing
    </span>
  );
  if (status === "complete") return (
    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
      <CheckCircle2 className="w-2.5 h-2.5" /> Complete
    </span>
  );
  if (status === "failed") return (
    <span className="flex items-center gap-1 text-[10px] text-rose-400">
      <XCircle className="w-2.5 h-2.5" /> Failed
    </span>
  );
  return <span className="text-[10px] text-[#374151]">—</span>;
}

function AnalysisPanel({ analysis }: { analysis: AnalysisResult }) {
  const objections = analysis.objections ?? [];
  const handledCount = objections.filter(o => o.handled).length;

  return (
    <div className="space-y-4">

      {/* Score row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Talk / Listen",   value: analysis.talk_listen_ratio ?? "—" },
          { label: "Tonality",        value: `${analysis.tonality_score   ?? "—"}/10` },
          { label: "Confidence",      value: `${analysis.confidence_score ?? "—"}/10` },
          { label: "Objections",      value: `${handledCount}/${objections.length} handled` },
        ].map(s => (
          <div key={s.label} className="bg-[#0d0f15] border border-[#1e2130] rounded-xl px-3 py-2.5 text-center">
            <p className="text-[10px] text-[#4b5563] uppercase tracking-wider mb-0.5">{s.label}</p>
            <p className="text-sm font-bold text-[#f0f2f8]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Focus area */}
      {analysis.focus_area && (
        <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-xl px-4 py-3.5">
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Focus Area</p>
          <p className="text-sm text-[#e5e7eb]">{analysis.focus_area}</p>
        </div>
      )}

      {/* Coaching summary */}
      {analysis.coaching_summary && (
        <div className="bg-[#0d0f15] border border-[#1e2130] rounded-xl px-4 py-3.5">
          <p className="text-[11px] font-bold text-[#4b5563] uppercase tracking-wider mb-1.5">Coaching Summary</p>
          <p className="text-xs text-[#9ca3af] leading-relaxed">{analysis.coaching_summary}</p>
        </div>
      )}

      {/* Objections */}
      {objections.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider mb-2">Objections</p>
          <div className="space-y-2">
            {objections.map((obj, i) => (
              <div key={i} className="bg-[#0d0f15] border border-[#1e2130] rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-[#f0f2f8]">{obj.objection_type}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                    obj.handled
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                  }`}>
                    {obj.handled ? "Handled" : "Lost"}
                  </span>
                </div>
                <p className="text-[11px] text-[#6b7280] mb-1">{obj.objection_text}</p>
                {obj.resolution_text && (
                  <p className="text-[11px] text-indigo-300/80 italic">{obj.resolution_text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mistakes + strengths */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(analysis.key_mistakes?.length ?? 0) > 0 && (
          <div className="bg-rose-500/[0.04] border border-rose-500/15 rounded-xl px-4 py-3.5">
            <p className="text-[11px] font-bold text-rose-400/80 uppercase tracking-wider mb-2">Key Mistakes</p>
            <ul className="space-y-1">
              {(analysis.key_mistakes ?? []).map((m, i) => (
                <li key={i} className="flex gap-2 text-xs text-[#9ca3af]">
                  <span className="text-rose-500/50 shrink-0 mt-0.5">•</span>{m}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(analysis.key_strengths?.length ?? 0) > 0 && (
          <div className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-xl px-4 py-3.5">
            <p className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-wider mb-2">Key Strengths</p>
            <ul className="space-y-1">
              {(analysis.key_strengths ?? []).map((s, i) => (
                <li key={i} className="flex gap-2 text-xs text-[#9ca3af]">
                  <span className="text-emerald-500/50 shrink-0 mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
