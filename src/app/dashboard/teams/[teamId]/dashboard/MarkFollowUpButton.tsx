"use client";

import { useTransition } from "react";
import { markFollowUpDone } from "./actions";
import { Check } from "lucide-react";

export default function MarkFollowUpButton({ applicationId, teamId }: { applicationId: string; teamId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => { void markFollowUpDone(applicationId, teamId); })}
      disabled={isPending}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors disabled:opacity-50"
    >
      <Check className="w-3 h-3" />
      {isPending ? "…" : "Mark Done"}
    </button>
  );
}
