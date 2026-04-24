import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserTeam, getProfileFull } from "@/lib/queries";
import { getMyDailyLogs, getTodayLog, getUserRankInTeam, getTeamKpi, computeScore, getKpiStatus } from "@/lib/crm-queries";
import { getPreviewRole } from "@/lib/preview";
import DailyLogForm from "@/components/crm/DailyLogForm";
import ClosedCallsSection from "@/components/crm/ClosedCallsSection";
import CallRecordsTab from "@/components/crm/CallRecordsTab";
import ImprovementTab from "@/components/crm/ImprovementTab";
import CrmTabs from "@/components/crm/CrmTabs";
import { Users, Trophy, TrendingUp } from "lucide-react";

export default async function CRMPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const resolvedParams = await searchParams;

  const [userTeam, profile, previewRole] = await Promise.all([
    getUserTeam(user.id),
    getProfileFull(user.id),
    getPreviewRole(),
  ]);

  const isPreview     = profile?.account_type === "owner" && !!previewRole;
  const effectiveRole = isPreview ? previewRole! : (profile?.role ?? null);

  const isSetter = effectiveRole === "setter";
  const isCloser = effectiveRole === "closer";

  const tab = typeof resolvedParams.tab === "string" ? resolvedParams.tab : "log";

  const [todayLog, logs, kpi] = await Promise.all([
    getTodayLog(user.id),
    getMyDailyLogs(user.id, 14),
    userTeam ? getTeamKpi(userTeam.teamId) : Promise.resolve(null),
  ]);

  const rankData = userTeam ? await getUserRankInTeam(user.id, userTeam.teamId, kpi) : null;
  const today    = new Date().toISOString().split("T")[0];
  const past     = logs.filter(l => l.log_date !== today);

  const totals = logs.reduce(
    (acc, l) => ({
      score:   acc.score   + computeScore(l, kpi),
      booked:  acc.booked  + l.calls_booked,
      pitched: acc.pitched + l.calls_pitched,
      hours:   acc.hours   + Number(l.hours_worked),
    }),
    { score: 0, booked: 0, pitched: 0, hours: 0 }
  );

  const bookingRate = totals.pitched > 0
    ? Math.round((totals.booked / totals.pitched) * 100)
    : 0;

  const kpiStatus = todayLog && kpi ? getKpiStatus(todayLog, kpi) : null;

  const KPI_DISPLAY = [
    { key: "outbound_messages", label: "Outbound"   },
    { key: "followup_messages", label: "Follow-ups" },
    { key: "calls_pitched",     label: "Pitched"    },
    { key: "calls_booked",      label: "Booked"     },
    { key: "replied",           label: "Replied"    },
    { key: "hours_worked",      label: "Hours"      },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px] space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">CRM</h1>
          {userTeam && <p className="text-sm text-[#6b7280] mt-0.5">{userTeam.team.name}</p>}
        </div>
        {rankData && rankData.total > 1 && (
          <div className="flex items-center gap-2 bg-[#111318] border border-[#1e2130] rounded-xl px-3 py-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-[#f0f2f8]">
              #{rankData.rank} <span className="text-[#4b5563]">of {rankData.total}</span>
            </span>
          </div>
        )}
      </div>

      {/* Closer tabs */}
      {isCloser && (
        <CrmTabs active={tab} />
      )}

      {/* ── Closer: Call Records tab ── */}
      {isCloser && tab === "records" && (
        <CallRecordsTab userId={user.id} />
      )}

      {/* ── Closer: Coaching tab ── */}
      {isCloser && tab === "coaching" && (
        <ImprovementTab userId={user.id} />
      )}

      {/* ── Daily log tab (default for all roles) ── */}
      {(!isCloser || tab === "log") && (
        <>
          {/* Soft note — no team yet */}
          {!userTeam && (
            <div className="flex items-start gap-3 bg-[#111318] border border-[#1e2130] rounded-xl px-4 py-3.5">
              <Users className="w-4 h-4 text-[#4b5563] shrink-0 mt-0.5" />
              <p className="text-xs text-[#6b7280] leading-relaxed">
                You&apos;re logging as a solo setter. Ask your manager for an invite link to connect with a team — your logs will sync automatically once you join.
              </p>
            </div>
          )}

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Score (14d)",   value: Math.round(totals.score).toString() },
              { label: "Calls Booked",  value: totals.booked.toString()            },
              { label: "Booking Rate",  value: `${bookingRate}%`                   },
              { label: "Hours Logged",  value: `${totals.hours.toFixed(1)}h`       },
            ].map(card => (
              <div key={card.label} className="bg-[#111318] border border-[#1e2130] rounded-xl px-4 py-3">
                <p className="text-[11px] text-[#4b5563] uppercase tracking-wider mb-1">{card.label}</p>
                <p className="text-lg font-bold text-[#f0f2f8]">{card.value}</p>
              </div>
            ))}
          </div>

          {/* KPI progress — only if on a team with KPIs set */}
          {kpi && todayLog && kpiStatus && (
            <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5">
              <p className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest mb-4">Today&apos;s KPI Progress</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                {KPI_DISPLAY.map(({ key, label }) => {
                  const tKey = key === "outbound_messages" ? "outbound_target"
                             : key === "followup_messages" ? "followup_target"
                             : key === "calls_pitched"     ? "pitched_target"
                             : key === "calls_booked"      ? "booked_target"
                             : key === "replied"           ? "replied_target"
                             : "hours_target";
                  const actual = Number((todayLog as Record<string, unknown>)[key] ?? 0);
                  const t      = Number((kpi      as Record<string, unknown>)[tKey] ?? 0);
                  const pct    = t > 0 ? Math.min(100, Math.round((actual / t) * 100)) : 0;
                  const met    = t > 0 && actual >= t;
                  const stat   = kpiStatus[key];
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#6b7280]">{label}</span>
                        <span className={`text-xs font-semibold ${met ? "text-emerald-400" : "text-[#9ca3af]"}`}>
                          {actual}{t > 0 ? ` / ${t}` : ""}
                          {stat && stat.multiplier > 1 && (
                            <span className="ml-1 text-amber-400">{stat.multiplier.toFixed(1)}×</span>
                          )}
                        </span>
                      </div>
                      {t > 0 && (
                        <div className="h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${met ? "bg-emerald-500" : pct >= 80 ? "bg-amber-500" : "bg-indigo-500/50"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {todayLog && (
                <p className="text-xs text-[#4b5563] mt-4">
                  Today&apos;s score: <span className="text-indigo-300 font-semibold">{Math.round(computeScore(todayLog, kpi))}</span>
                </p>
              )}
            </div>
          )}

          {/* Daily log form — always visible */}
          <DailyLogForm today={todayLog} kpi={kpi} />

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
                      {["Date","Outbound","Follow-up","Pitched","Booked","Replied","Hours","Score"].map(h => (
                        <th key={h} className="px-3 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider text-right first:text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2130]">
                    {past.map(l => (
                      <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 py-2.5 text-[#6b7280] text-xs whitespace-nowrap">{l.log_date}</td>
                        <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{l.outbound_messages}</td>
                        <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{l.followup_messages}</td>
                        <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{l.calls_pitched}</td>
                        <td className="px-3 py-2.5 text-emerald-400 text-xs text-right font-semibold">{l.calls_booked}</td>
                        <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{l.replied}</td>
                        <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{Number(l.hours_worked).toFixed(1)}</td>
                        <td className="px-3 py-2.5 text-indigo-300 text-xs text-right font-bold">{Math.round(computeScore(l, kpi))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Closed Calls — setter only, requires a team */}
          {isSetter && userTeam && (
            <ClosedCallsSection userId={user.id} teamId={userTeam.teamId} />
          )}
        </>
      )}

    </div>
  );
}
