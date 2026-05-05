"use client";

import { useState, useTransition } from "react";
import { addApplication } from "./actions";
import { Plus, X } from "lucide-react";

export default function AddApplicationModal({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("teamId", teamId);
    startTransition(async () => {
      const result = await addApplication(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Application
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#f0f2f8]">Log Application</h3>
              <button onClick={() => setOpen(false)} className="text-[#4b5563] hover:text-[#9ca3af] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Company Name *</label>
                <input name="companyName" required className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Applied Date *</label>
                <input name="appliedDate" type="date" required defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Follow-up Date</label>
                <input name="followUpDate" type="date"
                  className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Notes</label>
                <textarea name="notes" rows={2}
                  className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 resize-none" />
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {isPending ? "Saving…" : "Add Application"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg text-[#6b7280] hover:text-[#9ca3af] text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
