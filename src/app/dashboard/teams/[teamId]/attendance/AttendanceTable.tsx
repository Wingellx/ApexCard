"use client";

import { useTransition } from "react";
import { markAttendance } from "./actions";
import type { EchelonMember } from "@/lib/echelon-queries";

interface Props {
  teamId: string;
  members: EchelonMember[];
  sessions: { date: string; day: string; label: string }[];
  attended: Record<string, Record<string, boolean>>; // userId → date → attended
}

export default function AttendanceTable({ teamId, members, sessions, attended }: Props) {
  const [isPending, startTransition] = useTransition();

  function toggle(userId: string, sessionDate: string, sessionDay: string, checked: boolean) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("teamId", teamId);
      fd.set("userId", userId);
      fd.set("sessionDate", sessionDate);
      fd.set("sessionDay", sessionDay);
      fd.set("checked", String(checked));
      await markAttendance(fd);
    });
  }

  return (
    <div className={`overflow-x-auto rounded-2xl border border-[#1e2130] bg-[#111318]${isPending ? " opacity-70 pointer-events-none" : ""}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2130]">
            <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Member</th>
            {sessions.map(s => (
              <th key={s.date} className="px-4 py-3 text-center text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">
                {s.label}<br />
                <span className="text-[10px] font-normal text-[#374151]">{s.date}</span>
              </th>
            ))}
            <th className="px-4 py-3 text-center text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2130]">
          {members.map(m => {
            const rowAttended = attended[m.userId] ?? {};
            const total = sessions.filter(s => rowAttended[s.date]).length;
            return (
              <tr key={m.userId} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#1e2130] flex items-center justify-center shrink-0 overflow-hidden">
                      {m.avatarUrl
                        ? <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                        : <span className="text-[#9ca3af] text-[11px] font-bold">{m.name[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <p className="text-[#e5e7eb] text-xs font-semibold leading-tight">{m.name}</p>
                      <p className="text-[#4b5563] text-[10px] capitalize">{m.phase.replace("_", " ")}</p>
                    </div>
                  </div>
                </td>
                {sessions.map(s => {
                  const isChecked = !!rowAttended[s.date];
                  return (
                    <td key={s.date} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => toggle(m.userId, s.date, s.day, e.target.checked)}
                        className="w-4 h-4 rounded border-[#374151] bg-[#0d0f15] text-indigo-500 focus:ring-indigo-500/30 cursor-pointer"
                      />
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center">
                  <span className={`text-sm font-bold ${total > 0 ? "text-emerald-400" : "text-[#4b5563]"}`}>
                    {total}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
