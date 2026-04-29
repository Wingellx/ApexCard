"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, Check, X, Loader2, ExternalLink } from "lucide-react";
import type { RepVerificationRequestWithRep } from "@/lib/verification-queries";
import {
  approveVerificationRequest,
  declineVerificationRequest,
} from "@/app/dashboard/stats/verification-actions";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.apexcard.app";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function RequestCard({ req, onAction }: { req: RepVerificationRequestWithRep; onAction: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [confirm,   setConfirm]      = useState<"approve" | "decline" | null>(null);
  const [done,      setDone]         = useState<"approved" | "declined" | null>(null);
  const [error,     setError]        = useState("");

  function act(action: "approve" | "decline") {
    setError("");
    startTransition(async () => {
      const result = action === "approve"
        ? await approveVerificationRequest(req.id)
        : await declineVerificationRequest(req.id);

      if (result.error) { setError(result.error); setConfirm(null); return; }
      setDone(action === "approve" ? "approved" : "declined");
      setConfirm(null);
      onAction();
    });
  }

  if (done) {
    return (
      <div className={`px-5 py-4 flex items-center gap-3 ${done === "approved" ? "bg-emerald-500/[0.04]" : "opacity-50"}`}>
        {done === "approved"
          ? <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          : <X className="w-4 h-4 text-[#4b5563] shrink-0" />}
        <p className="text-sm text-[#6b7280]">
          <span className="font-semibold text-[#e5e7eb]">{req.rep_name}</span>{" "}
          {done === "approved" ? "has been verified." : "request declined."}
        </p>
      </div>
    );
  }

  const profileUrl = req.rep_username
    ? `${APP_URL}/card/${req.rep_username}`
    : `${APP_URL}/stats/${req.user_id}`;

  return (
    <div className="px-5 py-4 space-y-3">
      {/* Rep header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#f0f2f8]">{req.rep_name}</p>
            <a href={profileUrl} target="_blank" rel="noopener noreferrer"
              className="text-[#4b5563] hover:text-[#9ca3af] transition-colors">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-[11px] text-[#4b5563] mt-0.5">{req.rep_email}</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
          Pending
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Revenue",     value: fmt(req.lifetime_cash)              },
          { label: "Calls Taken", value: req.lifetime_calls.toLocaleString() },
          { label: "Deals Closed",value: req.lifetime_closed.toLocaleString()},
          { label: "Close Rate",  value: `${req.close_rate.toFixed(1)}%`     },
        ].map(s => (
          <div key={s.label} className="bg-[#0d0f15] border border-[#1a1d28] rounded-lg px-3 py-2.5">
            <p className="text-[10px] text-[#4b5563] uppercase tracking-wider mb-0.5">{s.label}</p>
            <p className="text-sm font-bold text-[#e5e7eb]">{s.value}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[#374151]">{req.days_logged} days logged in total</p>

      {/* Proof (owner path only) */}
      {req.proof_notes && (
        <div className="bg-[#0d0f15] border border-[#1a1d28] rounded-xl px-4 py-3 space-y-1.5">
          {req.proof_url && (
            <a href={req.proof_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold">
              <ExternalLink className="w-3 h-3" /> View proof link
            </a>
          )}
          <p className="text-xs text-[#9ca3af] leading-relaxed">{req.proof_notes}</p>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-rose-400">{error}</p>}

      {/* Actions */}
      {confirm === null ? (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setConfirm("approve")}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            type="button"
            onClick={() => setConfirm("decline")}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#9ca3af] hover:text-rose-400 transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" /> Decline
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 pt-1">
          <p className="text-xs text-[#9ca3af]">
            {confirm === "approve"
              ? `This will give ${req.rep_name} a verified badge. Continue?`
              : `Decline ${req.rep_name}'s request?`}
          </p>
          <button
            type="button"
            onClick={() => act(confirm)}
            disabled={isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50
              ${confirm === "approve"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"}`}
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setConfirm(null)}
            disabled={isPending}
            className="text-[11px] text-[#4b5563] hover:text-[#6b7280] transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

interface Props {
  requests: RepVerificationRequestWithRep[];
}

export default function ManagerVerificationPanel({ requests: initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const pending = requests.filter(r => r.status === "pending").length;

  if (requests.length === 0) return null;

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1e2130] flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">
          Verification Requests
        </p>
        {pending > 0 && (
          <span className="ml-auto text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
            {pending} pending
          </span>
        )}
      </div>

      <div className="divide-y divide-[#13161e]">
        {requests.map(req => (
          <RequestCard
            key={req.id}
            req={req}
            onAction={() => setRequests(prev =>
              prev.map(r => r.id === req.id ? { ...r, status: "approved" } : r)
            )}
          />
        ))}
      </div>
    </div>
  );
}
