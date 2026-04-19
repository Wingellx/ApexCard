"use client";

import { useState, useActionState, useEffect } from "react";
import { setMemberTrainingSplit, removeMember } from "./actions";
import { useToast } from "@/components/ui/ToastProvider";
import { ChevronDown, ChevronUp, Flame, PhoneCall, Trash2, Shield, CheckCircle2, XCircle } from "lucide-react";
import type { AdminMemberRow } from "@/lib/queries";

const PRESETS = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Cardio", "Rest"];

interface Props {
  member: AdminMemberRow;
  isSelf: boolean;
  dayLabels: string[];
  roleLabels: Record<string, string>;
}

function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function AdminMemberCard({ member, isSelf, dayLabels, roleLabels }: Props) {
  const { success, error: toastError } = useToast();
  const [open, setOpen] = useState(false);

  const boundSetSplit = setMemberTrainingSplit.bind(null, member.userId);
  const boundRemove   = removeMember.bind(null, member.userId);

  const [splitState, splitAction, splitPending] = useActionState(boundSetSplit, null);
  const [removeState, removeAction, removePending] = useActionState(boundRemove, null);

  const [sessions, setSessions] = useState<string[]>(
    Array.from({ length: 7 }, (_, i) => member.split[i + 1] ?? "Rest")
  );

  useEffect(() => {
    if (splitState && !splitState.error) success(`Split saved for ${member.name}.`);
    if (splitState?.error) toastError(splitState.error);
  }, [splitState]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (removeState?.error) toastError(removeState.error);
  }, [removeState]); // eslint-disable-line react-hooks/exhaustive-deps

  const inputClass = "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-2.5 py-2 text-xs text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors";

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
      {/* Member row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black text-white select-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
          {initials(member.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#f0f2f8] truncate">{member.name}</p>
            {isSelf && <span className="text-[10px] font-bold text-white bg-white/10 border border-white/20 px-1.5 py-0.5 rounded-full">You</span>}
            {member.memberRole === "admin" && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                <Shield className="w-2.5 h-2.5" /> Admin
              </span>
            )}
            {member.salesRole && (
              <span className="text-[10px] text-[#6b7280]">{roleLabels[member.salesRole] ?? member.salesRole}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[11px]">
            <span className="flex items-center gap-1 text-[#4b5563]">
              <Flame className="w-3 h-3" />
              {member.recentCheckins} debrief{member.recentCheckins !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1 text-[#4b5563]">
              <PhoneCall className="w-3 h-3" />
              {member.recentCalls} call log{member.recentCalls !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isSelf && (
            <form action={removeAction}>
              <button
                type="submit"
                disabled={removePending}
                onClick={e => { if (!confirm(`Remove ${member.name} from the team?`)) e.preventDefault(); }}
                className="p-2 text-[#374151] hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/[0.05] disabled:opacity-40"
                title="Remove member"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </form>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/[0.04]"
          >
            Set split
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Training split form */}
      {open && (
        <div className="border-t border-[#1e2130] px-4 py-4 bg-[#0d0f14]">
          <form action={splitAction} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dayLabels.map((day, i) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#6b7280] w-24 shrink-0">{day}</span>
                  <input
                    type="text"
                    name={`day_${i + 1}`}
                    value={sessions[i]}
                    onChange={e => setSessions(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                    placeholder="Rest"
                    list="admin-split-presets"
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            <datalist id="admin-split-presets">
              {PRESETS.map(p => <option key={p} value={p} />)}
            </datalist>
            {splitState?.error && (
              <div className="flex items-center gap-2 text-xs text-rose-400">
                <XCircle className="w-3.5 h-3.5 shrink-0" /> {splitState.error}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={splitPending}
                className="flex items-center gap-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {splitPending ? "Saving…" : <><CheckCircle2 className="w-3.5 h-3.5" /> Save split</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
