"use client";

import { useActionState } from "react";
import { joinTeam } from "./actions";
import { XCircle, ArrowRight } from "lucide-react";
import type { InviteRole, TokenType } from "@/lib/invite-queries";

export default function JoinButton({
  inviteCode,
  assignedRole,
  tokenType,
  teamName,
  isIO,
}: {
  inviteCode:   string;
  assignedRole: InviteRole;
  tokenType:    TokenType;
  teamName:     string;
  isIO?:        boolean;
}) {
  const action = joinTeam.bind(null, inviteCode, assignedRole, tokenType);
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
        className={`inline-flex items-center justify-center gap-2 w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg ${
          isIO
            ? "bg-white hover:bg-white/90 text-black shadow-white/10"
            : "bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20"
        }`}
      >
        {isPending ? "Joining…" : <>{`Join ${teamName}`} <ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
}
