"use client";

import { useActionState } from "react";
import { ArrowRight, XCircle } from "lucide-react";
import { signupForTeam } from "./actions";
import type { InviteRole, TokenType } from "@/lib/invite-queries";

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#4b5563] focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors";

export default function TeamSignupForm({
  inviteCode,
  teamName,
  assignedRole,
  tokenType,
}: {
  inviteCode:   string;
  teamName:     string;
  assignedRole: InviteRole;
  tokenType:    TokenType;
}) {
  const action = signupForTeam.bind(null, inviteCode, assignedRole, tokenType);
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
          Your name
        </label>
        <input
          name="full_name"
          type="text"
          placeholder="Alex Johnson"
          required
          autoFocus
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
          Email
        </label>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
          Password
        </label>
        <input
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
          minLength={8}
          className={inputClass}
        />
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-400">{state.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors mt-2 shadow-lg shadow-indigo-500/20"
      >
        {isPending ? "Creating account…" : <>Join {teamName} <ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
}
