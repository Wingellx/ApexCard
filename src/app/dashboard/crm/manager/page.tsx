import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserTeam, getUserTeamRole } from "@/lib/queries";
import { getTeamLeaderboard, getTeamDailyLogs, getManagerInviteTokens } from "@/lib/crm-queries";
import InviteGenerator from "@/components/crm/InviteGenerator";
import { Shield, Trophy, TrendingUp, Users } from "lucide-react";

function defaultRange() {
  const to   = new Date();
  const from = new Date();
  from.setDate(1);
  return {
    from: from.toISOString().split("T")[0],
    to:   to.toISOString().split("T")[0],
  };
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default async function CRMManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; member?: string; from?: string; to?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [role, userTeam] = await Promise.all([
    getUserTeamRole(user.id),
    getUserTeam(user.id),
  ]);

  if (role !== "admin" || !userTeam) redirect("/dashboard/crm");

  const params    = await searchParams;
  const tab       = params.tab || "leaderboard";
  const defaults  = defaultRange();
  const fromDate  = params.from   || defaults.from;
  const toDate    = params.to     || defaults.to;
  const memberFilter = params.member || "";

  const [leaderboard, logs, tokens] = await Promise.all([
    getTeamLeaderboard(userTeam.teamId, { from: fromDate, to: toDate }),
    tab === "logs" ? getTeamDailyLogs(userTeam.teamId, { from: fromDate, to: toDate, memberId: memberFilter || undefined }) : Promise.resolve([]),
    getManagerInviteTokens(user.id),
  ]);

  const teamTotal = leaderboard.reduce((s, m) => s + m.total_score, 0);

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1100px] space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400/80 uppercase tracking-widest">Manager View</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">{userTeam.team.name}</h1>
        <p className="text-sm text-[#6b7280] mt-0.5">{leaderboard.length} setter{leaderboard.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Team summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Team Score",    value: Math.round(teamTotal).toString()                                                   },
          { label: "Total Booked",  value: leaderboard.reduce((s, m) => s + m.total_booked,  0).toString()                   },
          { label: "Total Pitched", value: leaderboard.reduce((s, m) => s + m.total_pitched, 0).toString()                   },
          { label: "Avg Book Rate", value: (() => {
              const p = leaderboard.reduce((s, m) => s + m.total_pitched, 0);
              const b = leaderboard.reduce((s, m) => s + m.total_booked,  0);
              return p > 0 ? `${Math.round((b / p) * 100)}%` : "—";
            })()
          },
        ].map(c => (
          <div key={c.label} className="bg-[#111318] border border-[#1e2130] rounded-xl px-4 py-3">
            <p className="text-[11px] text-[#4b5563] uppercase tracking-wider mb-1">{c.label}</p>
            <p className="text-lg font-bold text-[#f0f2f8]">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Invite generator */}
      <InviteGenerator existingTokens={tokens} />

      {/* Date filter */}
      <form method="GET" className="flex flex-wrap items-end gap-3 bg-[#111318] border border-[#1e2130] rounded-2xl p-4">
        <input type="hidden" name="tab" value={tab} />
        <div>
          <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">From</label>
          <input name="from" type="date" defaultValue={fromDate}
            className="bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">To</label>
          <input name="to" type="date" defaultValue={toDate}
            className="bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>
        {tab === "logs" && (
          <div>
            <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Member</label>
            <select name="member" defaultValue={memberFilter}
              className="bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 transition-colors">
              <option value="">All</option>
              {leaderboard.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-sm font-semibold transition-colors">
          Apply
        </button>
        <a href={`/dashboard/crm/manager?tab=${tab}`} className="px-4 py-2 rounded-lg text-[#6b7280] hover:text-[#9ca3af] text-sm transition-colors">
          Reset
        </a>
      </form>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111318] border border-[#1e2130] rounded-xl p-1 w-fit">
        {[
          { key: "leaderboard", label: "Leaderboard", icon: Trophy      },
          { key: "logs",        label: "Daily Logs",  icon: TrendingUp  },
        ].map(({ key, label, icon: Icon }) => (
          <a
            key={key}
            href={`/dashboard/crm/manager?tab=${key}&from=${fromDate}&to=${toDate}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === key
                ? "bg-white/[0.07] text-white shadow-[inset_2px_0_0_0_rgba(139,92,246,0.85)]"
                : "text-[#4b5563] hover:text-[#9ca3af]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />{label}
          </a>
        ))}
      </div>

      {/* Leaderboard tab */}
      {tab === "leaderboard" && (
        leaderboard.length === 0 ? (
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center">
            <Users className="w-8 h-8 text-[#374151] mx-auto mb-3" />
            <p className="text-sm text-[#6b7280]">No data for this period.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((m, i) => {
              const rank = i + 1;
              const share = teamTotal > 0 ? (m.total_score / teamTotal) * 100 : 0;
              return (
                <div key={m.user_id} className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-7 text-center">{MEDAL[rank] ?? <span className="text-sm font-bold text-[#4b5563]">#{rank}</span>}</span>
                      <div>
                        <p className="text-sm font-bold text-[#f0f2f8]">{m.full_name || m.email}</p>
                        <p className="text-xs text-[#4b5563]">{m.days_logged} day{m.days_logged !== 1 ? "s" : ""} logged</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-indigo-300">{Math.round(m.total_score)}</p>
                      <p className="text-[11px] text-[#4b5563]">{share.toFixed(1)}% of team</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="h-1.5 bg-[#1e2130] rounded-full mb-4 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(share, 100)}%` }} />
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                    {[
                      { label: "Outbound",  value: m.total_outbound    },
                      { label: "Follow-up", value: m.total_followup    },
                      { label: "Pitched",   value: m.total_pitched     },
                      { label: "Booked",    value: m.total_booked,  highlight: true },
                      { label: "Replied",   value: m.total_replied     },
                      { label: "DQ'd",      value: m.total_disqualified },
                      { label: "Book %",    value: `${m.booking_rate}%` },
                    ].map(stat => (
                      <div key={stat.label} className="bg-[#0d0f15] rounded-lg px-2 py-2 text-center">
                        <p className="text-[10px] text-[#4b5563] uppercase tracking-wider">{stat.label}</p>
                        <p className={`text-sm font-bold mt-0.5 ${stat.highlight ? "text-emerald-400" : "text-[#9ca3af]"}`}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Daily logs tab */}
      {tab === "logs" && (
        logs.length === 0 ? (
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center">
            <Users className="w-8 h-8 text-[#374151] mx-auto mb-3" />
            <p className="text-sm text-[#6b7280]">No logs for this period.</p>
          </div>
        ) : (
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-[#1e2130]">
                  {["Date","Member","Outbound","Follow-up","Pitched","Booked","Replied","DQ","Hours","Score"].map(h => (
                    <th key={h} className="px-3 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider text-right first:text-left [&:nth-child(2)]:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2130]">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2.5 text-[#6b7280] text-xs whitespace-nowrap">{l.log_date}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs">{l.profiles?.full_name || l.profiles?.email || "—"}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{l.outbound_messages}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{l.followup_messages}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{l.calls_pitched}</td>
                    <td className="px-3 py-2.5 text-emerald-400 text-xs text-right font-semibold">{l.calls_booked}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{l.replied}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{l.disqualified}</td>
                    <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{Number(l.hours_worked).toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-indigo-300 text-xs text-right font-bold">{Math.round(Number(l.score))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

    </div>
  );
}
