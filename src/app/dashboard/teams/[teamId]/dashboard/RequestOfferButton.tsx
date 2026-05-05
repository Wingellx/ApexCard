"use client";

import { useState, useTransition } from "react";
import { requestOffer } from "./actions";
import { ArrowRight } from "lucide-react";

export default function RequestOfferButton({ teamId, alreadyPending }: { teamId: string; alreadyPending: boolean }) {
  const [done, setDone] = useState(alreadyPending);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-semibold">
        ⏳ Offer request pending — awaiting manager approval
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          startTransition(async () => {
            const result = await requestOffer(teamId);
            if (result.error) setError(result.error);
            else setDone(true);
          })
        }
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        {isPending ? "Sending…" : "I've Joined an Offer"}
      </button>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
