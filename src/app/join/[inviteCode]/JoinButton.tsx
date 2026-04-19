"use client";

import { useActionState } from "react";
import { joinTeam } from "./actions";
import { XCircle, ArrowRight } from "lucide-react";

export default function JoinButton({ inviteCode, teamName }: { inviteCode: string; teamName: string }) {
  const action = joinTeam.bind(null, inviteCode);
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-400">{state.error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
      >
        {isPending ? "Joining…" : <>{`Join ${teamName}`} <ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
}
