"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveCallRecord } from "@/app/dashboard/crm/closer-actions";
import { Loader2, Sparkles, Save, ChevronDown, ChevronUp } from "lucide-react";

const OUTCOMES = [
  { value: "closed",         label: "Closed"            },
  { value: "no_show",        label: "No Show"           },
  { value: "not_interested", label: "Not Interested"    },
  { value: "follow_up",      label: "Follow Up"         },
  { value: "objection_lost", label: "Lost on Objection" },
];

const inputCls =
  "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2.5 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";
const labelCls =
  "block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5";

export default function CallRecordForm() {
  const router  = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [open,      setOpen]      = useState(true);
  const [outcome,   setOutcome]   = useState("closed");
  const [saving,    setSaving]    = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);

  async function submit(analyse: boolean) {
    if (!formRef.current) return;
    setError(null);
    setSuccess(null);

    setSaving(true);
    const fd     = new FormData(formRef.current);
    const result = await saveCallRecord(null, fd);
    setSaving(false);

    if (result.error) { setError(result.error); return; }

    if (analyse && result.id) {
      setAnalysing(true);
      const res = await fetch("/api/analyse-call", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ callRecordId: result.id }),
      });
      setAnalysing(false);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Analysis failed.");
        router.refresh();
        return;
      }
      setSuccess("Call saved and analysed successfully.");
    } else {
      setSuccess("Call record saved.");
    }

    formRef.current.reset();
    setOutcome("closed");
    router.refresh();
  }

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-semibold text-[#f0f2f8]">Log Call Record</span>
        {open
          ? <ChevronUp   className="w-4 h-4 text-[#4b5563]" />
          : <ChevronDown className="w-4 h-4 text-[#4b5563]" />
        }
      </button>

      {open && (
        <div className="border-t border-[#1e2130] px-6 pb-6 pt-5">
          <form ref={formRef} onSubmit={e => e.preventDefault()} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Lead Name</label>
                <input name="lead_name" type="text" required placeholder="e.g. John Smith" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Call Date</label>
                <input name="call_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Outcome</label>
                <select name="call_outcome" value={outcome} onChange={e => setOutcome(e.target.value)} className={inputCls}>
                  {OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {outcome === "closed" && (
                <div>
                  <label className={labelCls}>Deal Value ($)</label>
                  <input name="deal_value" type="number" min="0" step="0.01" placeholder="0.00" className={inputCls} />
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>
                Recording Link{" "}
                <span className="normal-case font-normal text-[#374151]">(optional — Fathom, Zoom, etc.)</span>
              </label>
              <input name="recording_url" type="text" placeholder="https://…" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>
                Notes <span className="normal-case font-normal text-[#374151]">(optional)</span>
              </label>
              <textarea name="notes" rows={2} placeholder="Key points, follow-up actions…" className={`${inputCls} resize-none`} />
            </div>

            <div>
              <label className={labelCls}>
                Paste Transcript{" "}
                <span className="normal-case font-normal text-[#374151]">Fathom, Otter, or any transcript</span>
              </label>
              <textarea
                name="transcript"
                rows={9}
                placeholder="Paste your call transcript here to enable AI analysis…"
                className={`${inputCls} resize-y font-mono text-[11px] leading-relaxed`}
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
                <p className="text-xs text-emerald-400">{success}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => submit(false)}
                disabled={saving || analysing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-sm font-semibold text-[#9ca3af] transition-colors disabled:opacity-50"
              >
                {saving && !analysing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={saving || analysing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-sm font-semibold text-indigo-300 transition-colors disabled:opacity-50"
              >
                {analysing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {analysing ? "Analysing…" : "Analyse Call"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
