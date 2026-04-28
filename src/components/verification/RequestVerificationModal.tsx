"use client";

import { useState, useTransition } from "react";
import { X, ShieldCheck, Search, Loader2, Check, FileText, ExternalLink } from "lucide-react";
import type { ApprovedManager } from "@/lib/verification-queries";
import {
  requestManagerVerification,
  requestOwnerVerification,
} from "@/app/dashboard/stats/verification-actions";

type Tab = "manager" | "owner";

interface Props {
  managers: ApprovedManager[];
  onClose: () => void;
  onSuccess: () => void;
}

const inputCls = "w-full bg-[#0d0f15] border border-[#1e2130] rounded-xl px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors";

export default function RequestVerificationModal({ managers, onClose, onSuccess }: Props) {
  const [tab,             setTab]             = useState<Tab>("manager");
  const [search,          setSearch]          = useState("");
  const [selectedManager, setSelectedManager] = useState<ApprovedManager | null>(null);
  const [proofUrl,        setProofUrl]        = useState("");
  const [proofNotes,      setProofNotes]      = useState("");
  const [error,           setError]           = useState("");
  const [isPending,       startTransition]    = useTransition();

  const filtered = managers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.team_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      let result: { error?: string };
      if (tab === "manager") {
        if (!selectedManager) { setError("Please select a manager."); return; }
        result = await requestManagerVerification(selectedManager.id);
      } else {
        if (!proofNotes.trim()) { setError("Please add a note about your performance."); return; }
        result = await requestOwnerVerification(proofUrl, proofNotes);
      }
      if (result.error) { setError(result.error); return; }
      onSuccess();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[#0f1117] border border-[#1e2130] rounded-2xl overflow-hidden shadow-2xl">
        {/* Top accent */}
        <div className="h-[2px] bg-gradient-to-r from-indigo-500 to-violet-500" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-[#f0f2f8]">Request Verification</h2>
                <p className="text-[11px] text-[#6b7280] mt-0.5">Get a verified badge on your public stats card</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-2 rounded-xl text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#0a0c12] border border-[#1e2130] rounded-xl p-1 mb-5">
            {(["manager", "owner"] as Tab[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  tab === t
                    ? "bg-indigo-600 text-white"
                    : "text-[#6b7280] hover:text-[#9ca3af]"
                }`}
              >
                {t === "manager" ? "Verified by Manager" : "Verified by ApexCard"}
              </button>
            ))}
          </div>

          {/* Manager tab */}
          {tab === "manager" && (
            <div className="space-y-3">
              <p className="text-xs text-[#6b7280] leading-relaxed">
                Select a manager from the list. They&apos;ll receive an email with your stats and a one-click approve button.
              </p>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#374151]" />
                <input
                  type="text"
                  placeholder="Search by name or team…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={inputCls + " pl-9"}
                />
              </div>

              {/* Manager list */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-[#1e2130] divide-y divide-[#1a1d28]">
                {filtered.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-[#4b5563]">No managers found.</p>
                  </div>
                ) : (
                  filtered.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedManager(m)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.03]
                        ${selectedManager?.id === m.id ? "bg-indigo-500/[0.07]" : ""}`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#e5e7eb]">{m.name}</p>
                        {m.team_name && (
                          <p className="text-[11px] text-[#4b5563] mt-0.5">{m.team_name}</p>
                        )}
                      </div>
                      {selectedManager?.id === m.id && (
                        <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {selectedManager && (
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/[0.06] border border-indigo-500/20 rounded-xl">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <p className="text-xs text-indigo-300">
                    Request will be sent to <span className="font-semibold">{selectedManager.name}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Owner tab */}
          {tab === "owner" && (
            <div className="space-y-3">
              <p className="text-xs text-[#6b7280] leading-relaxed">
                Submit proof of your performance directly to ApexCard. Include a link to your stats (Fathom, Google Drive, screenshot) and a short note.
              </p>

              <div>
                <label className="text-[10px] font-bold text-[#4b5563] uppercase tracking-widest block mb-1.5">
                  Proof Link <span className="text-[#374151] normal-case font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#374151]" />
                  <input
                    type="url"
                    placeholder="https://…"
                    value={proofUrl}
                    onChange={e => setProofUrl(e.target.value)}
                    className={inputCls + " pl-9"}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#4b5563] uppercase tracking-widest block mb-1.5">
                  Your Note <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-[#374151]" />
                  <textarea
                    rows={4}
                    placeholder="Describe your background, the offer you closed on, how long you've been in sales, etc."
                    value={proofNotes}
                    onChange={e => setProofNotes(e.target.value)}
                    className={inputCls + " pl-9 resize-none"}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 px-4 py-2.5 bg-rose-500/[0.07] border border-rose-500/[0.15] rounded-xl">
              <p className="text-xs text-rose-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isPending
              ? "Submitting…"
              : tab === "manager"
              ? "Send Verification Request"
              : "Submit to ApexCard"}
          </button>
        </div>
      </div>
    </div>
  );
}
