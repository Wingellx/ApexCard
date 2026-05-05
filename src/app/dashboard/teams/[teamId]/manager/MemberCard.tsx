"use client";

import { useState, useTransition } from "react";
import { moveToOutreach, setCourseComplete, saveManagerNote } from "./actions";
import type { EchelonMemberDetail } from "@/lib/echelon-queries";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  member: EchelonMemberDetail;
  teamId: string;
}

function phaseBadge(phase: string) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    learning: { label: "Learning", color: "text-gray-400",  bg: "bg-gray-500/10 border-gray-500/20" },
    outreach: { label: "Outreach", color: "text-blue-400",  bg: "bg-blue-500/10 border-blue-500/20" },
    on_offer: { label: "On Offer", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  };
  return cfg[phase] ?? cfg.learning;
}

export default function MemberCard({ member, teamId }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const badge = phaseBadge(member.phase);

  const canMoveToOutreach =
    member.phase === "learning" &&
    member.courseComplete &&
    member.groupCallCount >= 4;

  const missingRequirements: string[] = [];
  if (member.phase === "learning") {
    if (!member.courseComplete)      missingRequirements.push("course not complete");
    if (member.groupCallCount < 4)   missingRequirements.push(`${4 - member.groupCallCount} more group call${4 - member.groupCallCount !== 1 ? "s" : ""} needed`);
  }

  function handleMoveToOutreach() {
    setError(null);
    startTransition(async () => {
      const result = await moveToOutreach(member.userId, teamId);
      if (result.error) setError(result.error);
    });
  }

  function handleCourseToggle(checked: boolean) {
    startTransition(async () => {
      await setCourseComplete(member.userId, teamId, checked);
    });
  }

  function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    setNoteSaved(false);
    startTransition(async () => {
      const result = await saveManagerNote(member.userId, teamId, note);
      if (!result.error) setNoteSaved(true);
    });
  }

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden">
      {/* Row */}
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-[#1e2130] flex items-center justify-center shrink-0 overflow-hidden">
          {member.avatarUrl
            ? <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
            : <span className="text-[#9ca3af] text-xs font-bold">{member.name[0]?.toUpperCase()}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#e5e7eb] truncate">{member.name}</p>
          <p className="text-[11px] text-[#4b5563]">{member.email}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.color} ${badge.bg}`}>
            {badge.label}
          </span>

          {/* Phase action */}
          {member.phase === "learning" && (
            canMoveToOutreach ? (
              <button
                onClick={handleMoveToOutreach}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isPending ? "…" : "Move to Outreach"}
              </button>
            ) : (
              <div className="relative group">
                <button
                  disabled
                  className="px-3 py-1.5 rounded-lg bg-[#1e2130] border border-[#2d3147] text-[#374151] text-xs font-semibold cursor-not-allowed"
                >
                  Move to Outreach
                </button>
                <div className="absolute right-0 top-full mt-1.5 z-10 hidden group-hover:block bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-[11px] text-[#9ca3af] whitespace-nowrap shadow-xl">
                  {missingRequirements.join(" · ")}
                </div>
              </div>
            )
          )}

          {member.phase === "outreach" && (
            <span className="text-xs text-[#6b7280] font-medium px-3 py-1.5 bg-[#0d0f15] border border-[#1e2130] rounded-lg">
              {member.offerRequestStatus === "pending" ? "⏳ Offer request pending" : "Waiting for offer request"}
            </span>
          )}

          {member.phase === "on_offer" && (
            <span className="text-xs text-emerald-400 font-medium">CRM active</span>
          )}
        </div>
        <div className="shrink-0 text-[#4b5563] text-xs">
          <span title="Group calls attended">{member.groupCallCount} calls</span>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="shrink-0 text-[#4b5563] hover:text-[#9ca3af] transition-colors"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Detail drawer */}
      {open && (
        <div className="border-t border-[#1e2130] px-5 py-4 space-y-4 bg-[#0d0f15]">
          {error && <p className="text-xs text-rose-400">{error}</p>}

          {/* Course complete toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#9ca3af]">Course Complete</p>
              <p className="text-[11px] text-[#4b5563]">Mark when student finishes the training course</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={member.courseComplete}
                onChange={e => handleCourseToggle(e.target.checked)}
                disabled={isPending}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-[#1e2130] peer-focus:ring-2 peer-focus:ring-indigo-500/30 rounded-full peer peer-checked:after:translate-x-5 after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500" />
            </label>
          </div>

          {/* Score */}
          {member.score !== null && (
            <div>
              <p className="text-xs font-semibold text-[#9ca3af]">Current Score</p>
              <p className="text-lg font-bold text-[#f0f2f8]">{member.score}<span className="text-xs text-[#4b5563]">/100</span></p>
            </div>
          )}

          {/* Manager notes */}
          <form onSubmit={handleSaveNote} className="space-y-2">
            <p className="text-xs font-semibold text-[#9ca3af]">Private Manager Notes</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add private notes about this member…"
              rows={3}
              className="w-full bg-[#111318] border border-[#1e2130] rounded-lg px-3 py-2 text-xs text-[#e5e7eb] placeholder-[#374151] focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending || !note.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#1e2130] hover:bg-[#2d3147] border border-[#2d3147] text-[#9ca3af] text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save Note"}
              </button>
              {noteSaved && <span className="text-[11px] text-emerald-400">Saved ✓</span>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
