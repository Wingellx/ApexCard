import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserTeam } from "@/lib/queries";
import { getMyDailyLogs, getTodayLog, getUserRankInTeam } from "@/lib/crm-queries";
import DailyLogForm from "@/components/crm/DailyLogForm";
import { Users, Trophy, TrendingUp } from "lucide-react";

function fmt(n: number | null | undefined) {
  return n == null ? "0" : String(n);
}

export default async function CRMPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const userTeam = await getUserTeam(user.id);

  if (!userTeam) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px]">
        <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight mb-6">CRM</h1>
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center">
          <Users className="w-8 h-8 text-[#374151] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#f0f2f8] mb-1">You&apos;re not on a team yet</p>
          <p className="text-sm text-[#6b7280]">Ask your manager to send you an invite link to get started.</p>
        </div>
      </div>
    );
  }

  const [todayLog, logs, rankData] = await Promise.all([
    getTodayLog(user.id),
    getMyDailyLogs(user.id, 14),
    getUserRankInTeam(user.id, userTeam.teamId),
  ]);

  const past = logs.filter(l => l.log_date !== new Date().toISOString().split("T")[0]);

  const totals = logs.reduce(
    (acc, l) => ({
      score:    acc.score    + Number(l.score),
      booked:   acc.booked   + l.calls_booked,
      pitched:  acc.pitched  + l.calls_pitched,
      outbound: acc.outbound + l.outbound_messages,
      hours:    acc.hours    + Number(l.hours_worked),
    }),
    { score: 0, booked: 0, pitched: 0, outbound: 0, hours: 0 }
  );

  const bookingRate = totals.pitched > 0
    ? Math.round((totals.booked / totals.pitched) * 100)
    : 0;

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px] space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">CRM</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">{userTeam.team.name}</p>
        </div>
        {rankData.total > 1 && (
          <div className="flex items-center gap-2 bg-[#111318] border border-[#1e2130] rounded-xl px-3 py-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-[#f0f2f8]">
              #{rankData.rank} <span className="text-[#4b5563]">of {rankData.total}</span>
            </span>
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Score (14d)",    value: Math.round(totals.score).toString()     },
          { label: "Calls Booked",   value: totals.booked.toString()                },
          { label: "Booking Rate",   value: `${bookingRate}%`                       },
          { label: "Hours Logged",   value: `${totals.hours.toFixed(1)}h`           },
        ].map(card => (
          <div key={card.label} className="bg-[#111318] border border-[#1e2130] rounded-xl px-4 py-3">
            <p className="text-[11px] text-[#4b5563] uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-lg font-bold text-[#f0f2f8]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Daily log form */}
      <DailyLogForm today={todayLog} />

      {/* History */}
      {past.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-[#4b5563]" />
            <h2 className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest">History</h2>
          </div>
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-[#1e2130]">
                  {["Date","Outbound","Follow-up","Pitched","Booked","Replied","DQ","Hours","Score"].map(h => (
                    <th key={h} className="px-3 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider text-right first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2130]">
                {past.map(l => (
                  <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2.5 text-[#6b7280] text-xs whitespace-nowrap">{l.log_date}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{fmt(l.outbound_messages)}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{fmt(l.followup_messages)}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{fmt(l.calls_pitched)}</td>
                    <td className="px-3 py-2.5 text-emerald-400 text-xs text-right font-semibold">{fmt(l.calls_booked)}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{fmt(l.replied)}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{fmt(l.disqualified)}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{Number(l.hours_worked).toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-indigo-300 text-xs text-right font-bold">{Math.round(Number(l.score))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
}
