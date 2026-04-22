"use client";

import { useState } from "react";
import { Link2, Check, Loader2 } from "lucide-react";

export default function CopyInviteButton({ teamId }: { teamId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "error">("idle");

  async function handleClick() {
    setState("loading");
    try {
      const res  = await fetch("/api/teams/invite-link", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ teamId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await navigator.clipboard.writeText(data.link);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="mt-1 w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#9ca3af] hover:text-indigo-400 bg-white/[0.03] hover:bg-indigo-500/[0.06] border border-white/[0.06] hover:border-indigo-500/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
    >
      {state === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {state === "copied"  && <Check   className="w-3.5 h-3.5 text-emerald-400" />}
      {state === "idle" || state === "error" ? <Link2 className="w-3.5 h-3.5" /> : null}
      {state === "loading" ? "Generating…"        : null}
      {state === "copied"  ? "Copied!"             : null}
      {state === "error"   ? "Error — try again"  : null}
      {state === "idle"    ? "Copy invite link"    : null}
    </button>
  );
}
