"use client";

import { useActionState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { approveOwner, rejectOwner } from "./actions";

export function ApproveForm({ requestId, userId }: { requestId: string; userId: string }) {
  const [state, formAction, isPending] = useActionState(approveOwner, null);
  return (
    <form action={formAction}>
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="user_id"    value={userId} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        {isPending ? "Approving…" : "Approve"}
      </button>
      {state?.error && <p className="text-xs text-rose-400 mt-1">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-400 mt-1">Approved.</p>}
    </form>
  );
}

export function RejectForm({ requestId }: { requestId: string }) {
  const [state, formAction, isPending] = useActionState(rejectOwner, null);
  return (
    <form action={formAction} className="flex items-center gap-2 flex-wrap">
      <input type="hidden" name="request_id" value={requestId} />
      <input
        name="admin_notes"
        type="text"
        placeholder="Reason (optional)"
        className="text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[#9ca3af] placeholder-[#374151] focus:outline-none focus:border-rose-500/40 transition-colors w-40"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <XCircle className="w-3.5 h-3.5" />
        {isPending ? "Rejecting…" : "Reject"}
      </button>
      {state?.error && <p className="text-xs text-rose-400 mt-1">{state.error}</p>}
    </form>
  );
}
