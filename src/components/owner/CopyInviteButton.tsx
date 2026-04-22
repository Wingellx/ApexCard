"use client";

import { useState, useRef } from "react";
import { Link2, Check, Loader2, Copy } from "lucide-react";

export default function CopyInviteButton({ teamId }: { teamId: string }) {
  const [state, setState]   = useState<"idle" | "loading" | "copied" | "show" | "error">("idle");
  const [link,  setLink]    = useState("");
  const [errMsg, setErrMsg] = useState("");
  const inputRef            = useRef<HTMLInputElement>(null);

  async function handleGenerate() {
    setState("loading");
    setErrMsg("");
    try {
      const res  = await fetch("/api/teams/invite-link", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ teamId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Server error");

      const generatedLink: string = data.link;
      setLink(generatedLink);

      // Try clipboard first; fall back to showing the link
      try {
        await navigator.clipboard.writeText(generatedLink);
        setState("copied");
        setTimeout(() => setState("idle"), 2500);
      } catch {
        setState("show");
        setTimeout(() => inputRef.current?.select(), 50);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrMsg(msg);
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  function handleManualCopy() {
    inputRef.current?.select();
    try {
      document.execCommand("copy");
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      // just leave the input selected so they can Ctrl+C
    }
  }

  if (state === "show") {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] text-[#4b5563]">Copy this link:</p>
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            readOnly
            value={link}
            className="flex-1 text-xs bg-[#0f1117] border border-[#1e2130] rounded-lg px-3 py-2 text-[#9ca3af] focus:outline-none focus:border-indigo-500/50 min-w-0"
          />
          <button
            onClick={handleManualCopy}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 px-3 py-2 rounded-lg transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleGenerate}
        disabled={state === "loading"}
        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#9ca3af] hover:text-indigo-400 bg-white/[0.03] hover:bg-indigo-500/[0.06] border border-white/[0.06] hover:border-indigo-500/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {state === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {state === "copied"  && <Check   className="w-3.5 h-3.5 text-emerald-400" />}
        {(state === "idle" || state === "error") && <Link2 className="w-3.5 h-3.5" />}
        {state === "loading" ? "Generating…"     : null}
        {state === "copied"  ? "Copied!"          : null}
        {state === "idle"    ? "Copy invite link" : null}
        {state === "error"   ? "Failed — retry"  : null}
      </button>
      {state === "error" && errMsg && (
        <p className="text-[10px] text-red-400 text-center">{errMsg}</p>
      )}
    </div>
  );
}
