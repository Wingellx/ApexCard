"use client";

import { useState, useTransition } from "react";
import { logOutreach } from "./actions";
import { Send } from "lucide-react";

export default function OutreachLogger({ teamId }: { teamId: string }) {
  const [count, setCount] = useState(1);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("teamId", teamId);
      fd.set("count", String(count));
      const result = await logOutreach(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setCount(1);
      }
    });
  }

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[#f0f2f8]">Log Today&apos;s Outreach</h3>
        <p className="text-xs text-[#6b7280] mt-0.5">How many people did you reach out to today?</p>
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={9999}
          value={count}
          onChange={e => setCount(parseInt(e.target.value, 10) || 1)}
          className="w-24 bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] text-center focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          {isPending ? "Saving…" : "Log"}
        </button>
        {success && <span className="text-xs text-emerald-400 font-semibold">Logged ✓</span>}
        {error   && <span className="text-xs text-rose-400">{error}</span>}
      </form>
    </div>
  );
}
