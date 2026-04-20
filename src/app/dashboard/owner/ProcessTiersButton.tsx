"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

type Result = {
  promoted: { teamId: string; name: string; from: number; to: number }[];
  demoted:  { teamId: string; name: string; from: number; to: number }[];
  month: string;
} | null;

export default function ProcessTiersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<Result>(null);
  const [error, setError]     = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/rankings/process-tiers", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setResult({ promoted: data.promoted ?? [], demoted: data.demoted ?? [], month: data.month ?? "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Processing…" : "Process Month-End Tiers"}
      </button>

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/[0.07] border border-rose-500/20 rounded-xl px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="bg-[#0f1117] border border-[#1e2130] rounded-xl p-4 space-y-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            Processed: {result.month}
          </div>
          {result.promoted.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#4b5563] mb-1.5">Promoted</p>
              {result.promoted.map((t) => (
                <p key={t.teamId} className="text-emerald-400">
                  {t.name} — Tier {t.from} → {t.to}
                </p>
              ))}
            </div>
          )}
          {result.demoted.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#4b5563] mb-1.5">Demoted</p>
              {result.demoted.map((t) => (
                <p key={t.teamId} className="text-rose-400">
                  {t.name} — Tier {t.from} → {t.to}
                </p>
              ))}
            </div>
          )}
          {result.promoted.length === 0 && result.demoted.length === 0 && (
            <p className="text-[#4b5563]">No tier changes this period.</p>
          )}
        </div>
      )}
    </div>
  );
}
