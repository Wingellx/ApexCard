"use client";

import { useState } from "react";
import { PlusCircle, Clock } from "lucide-react";
import Button from "@/components/ui/Button";

interface Props {
  parentTeamName: string;
}

export default function CreateTeamForm({ parentTeamName }: Props) {
  const [open,    setOpen]    = useState(false);
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/teams/create", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name: name.trim() }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to create team.");
    } else {
      setDone(true);
      setName("");
    }
  }

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5">
      <button
        onClick={() => { setOpen(o => !o); setDone(false); setError(null); }}
        className="flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
      >
        <PlusCircle className="w-4 h-4" />
        Create a new sub-team
      </button>

      {open && (
        <div className="mt-4">
          {done ? (
            <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
              <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Pending approval</p>
                <p className="text-xs text-amber-400/70 mt-0.5">
                  Your request has been sent. The team will become active once approved.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
                  Team name <span className="normal-case text-[#374151]">under {parentTeamName}</span>
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Offer A Team"
                  className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-2.5 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              {error && (
                <p className="text-xs text-rose-400">{error}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={loading}>
                  Request approval
                </Button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#6b7280] hover:text-[#9ca3af] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
