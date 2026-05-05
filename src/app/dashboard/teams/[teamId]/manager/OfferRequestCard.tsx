"use client";

import { useTransition } from "react";
import { approveOfferRequest, rejectOfferRequest } from "./actions";
import { Check, X } from "lucide-react";

interface Requester {
  userId: string;
  name: string;
  requestedAt: string | null;
}

export default function OfferRequestCard({ requesters, teamId }: { requesters: Requester[]; teamId: string }) {
  const [isPending, startTransition] = useTransition();

  if (!requesters.length) return null;

  return (
    <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-2xl p-5 space-y-4">
      <p className="text-sm font-bold text-amber-300">
        ⏳ Offer Requests ({requesters.length})
      </p>
      <div className="space-y-3">
        {requesters.map(r => (
          <div key={r.userId} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#e5e7eb]">{r.name}</p>
              {r.requestedAt && (
                <p className="text-[11px] text-[#6b7280]">
                  Requested {new Date(r.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => startTransition(() => { void approveOfferRequest(r.userId, teamId); })}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Check className="w-3 h-3" /> Approve
              </button>
              <button
                onClick={() => startTransition(() => { void rejectOfferRequest(r.userId, teamId); })}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
