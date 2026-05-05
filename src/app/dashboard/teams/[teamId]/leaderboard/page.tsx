import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { useTeamFeatures } from "@/hooks/useTeamFeatures";
import { getEchelonTeamMembers, getGroupCallAttendance, getTeamScores, getWeekSessions } from "@/lib/echelon-queries";

function phaseBadge(phase: string) {
  const cfg: Record<string, { label: string; color: string }> = {
    learning: { label: "Learning", color: "#6b7280" },
    outreach: { label: "Outreach", color: "#2563eb" },
    on_offer: { label: "On Offer", color: "#059669" },
  };
  const c = cfg[phase] ?? cfg.learning;
  return { label: c.label, color: c.color };
}

export default async function EchelonLeaderboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { teamId } = await params;

  const admin = createAdminClient();

  // Verify user belongs to this team
  const { data: membership } = await admin
    .from("team_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership) notFound();

  // Check feature flag
  const features = await useTeamFeatures(teamId);
  if (!features.leaderboard) notFound();

  const { wednesday, sunday } = getWeekSessions();

  const [members, attendance, scores] = await Promise.all([
    getEchelonTeamMembers(teamId),
    getGroupCallAttendance(teamId, [wednesday, sunday]),
    getTeamScores(teamId),
  ]);

  // Check weekly activity (any CRM or outreach log this week)
  const { start: weekStart, end: weekEnd } = (() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(now);
    mon.setDate(now.getDate() + diff);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const iso = (d: Date) => d.toISOString().split("T")[0];
    return { start: iso(mon), end: iso(sun) };
  })();

  const { data: weekActivity } = await admin
    .from("outreach_logs")
    .select("user_id")
    .eq("team_id", teamId)
    .gte("log_date", weekStart)
    .lte("log_date", weekEnd);

  const activeThisWeek = new Set((weekActivity ?? []).map(r => r.user_id as string));

  // Also check crm_daily_logs for on_offer members
  const { data: crmActivity } = await admin
    .from("crm_daily_logs")
    .select("user_id")
    .eq("team_id", teamId)
    .gte("log_date", weekStart)
    .lte("log_date", weekEnd);
  for (const r of crmActivity ?? []) activeThisWeek.add(r.user_id as string);

  // Build leaderboard rows sorted by score
  const rows = members
    .map((m) => {
      const callsAttended = (attendance.get(m.userId)?.size ?? 0);
      const score         = scores.get(m.userId) ?? 0;
      return { ...m, groupCalls: callsAttended, score, activeThisWeek: activeThisWeek.has(m.userId) };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a3a6b 100%)" }}
    >
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Echelon branding */}
        <div className="flex flex-col items-center gap-4 py-6">
          <Image src="/echelon-logo.png" alt="Echelon" width={160} height={56} className="object-contain" />
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Leaderboard</h1>
            <p className="text-sm text-blue-200/70 mt-1">{members.length} members</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-blue-200/50 text-sm">No members yet.</p>
          </div>
        ) : (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {["Rank", "Member", "Phase", "Score", "Group Calls", "Activity"].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[11px] font-semibold text-blue-200/50 uppercase tracking-wider text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {rows.map((m, i) => {
                  const rank  = i + 1;
                  const badge = phaseBadge(m.phase);
                  return (
                    <tr key={m.userId} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3.5 text-white font-bold text-sm w-12">
                        {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {m.avatarUrl
                              ? <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                              : <span className="text-white text-xs font-bold">{m.name[0]?.toUpperCase()}</span>
                            }
                          </div>
                          <span className="text-white text-sm font-semibold">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-white font-bold text-sm">
                        {m.score}<span className="text-blue-200/40 font-normal text-xs">/100</span>
                      </td>
                      <td className="px-4 py-3.5 text-blue-100 text-sm">{m.groupCalls}</td>
                      <td className="px-4 py-3.5">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: m.activeThisWeek ? "#22c55e" : "#374151" }}
                          title={m.activeThisWeek ? "Active this week" : "No activity this week"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
