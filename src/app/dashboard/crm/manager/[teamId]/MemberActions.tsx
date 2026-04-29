"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Mail, Loader2 } from "lucide-react";
import { removeMember } from "@/app/dashboard/crm/manager/actions";

interface Props {
  teamId: string;
  userId: string;
  memberName: string;
  email: string;
}

export default function MemberActions({ teamId, userId, memberName, email }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removed, setRemoved]             = useState(false);
  const [resendState, setResendState]     = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError]                 = useState("");

  if (removed) return <span className="text-[11px] text-[#374151] italic">Removed</span>;

  function handleRemove() {
    setError("");
    startTransition(async () => {
      const result = await removeMember(teamId, userId);
      if (result.error) { setError(result.error); setConfirmRemove(false); return; }
      setRemoved(true);
      router.refresh();
    });
  }

  async function handleResend() {
    setResendState("sending");
    try {
      const res = await fetch("/api/crm/invite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, invitedRole: "member", teamId }),
      });
      const data = await res.json();
      if (!res.ok) { setResendState("error"); setError(data.error ?? "Failed to send."); return; }
      setResendState("sent");
      setTimeout(() => setResendState("idle"), 3000);
    } catch {
      setResendState("error");
      setError("Network error.");
    }
  }

  if (confirmRemove) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[11px] text-[#9ca3af]">Remove {memberName}?</p>
        <button
          type="button"
          onClick={handleRemove}
          disabled={isPending}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setConfirmRemove(false)}
          disabled={isPending}
          className="text-[11px] text-[#4b5563] hover:text-[#6b7280] transition-colors"
        >
          Cancel
        </button>
        {error && <p className="text-[11px] text-rose-400 w-full">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleResend}
        disabled={resendState === "sending" || resendState === "sent"}
        title="Resend invite email"
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#4b5563] hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-colors disabled:opacity-50"
      >
        {resendState === "sending" ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Mail className="w-3 h-3" />
        )}
        {resendState === "sent" ? "Sent" : "Resend email"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmRemove(true)}
        title="Remove member"
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#4b5563] hover:text-rose-400 hover:bg-rose-500/[0.05] border border-transparent hover:border-rose-500/20 transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Remove
      </button>
    </div>
  );
}
