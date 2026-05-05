import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEchelonMemberData, getEchelonApplications, getOutreachLogs, getUserGroupCallCount, getUserScore, getWeekSessions } from "@/lib/echelon-queries";
import { calculateEchelonScore } from "@/lib/scoring/echelonScore";
import OutreachLogger from "./OutreachLogger";
import AddApplicationModal from "./AddApplicationModal";
import MarkFollowUpButton from "./MarkFollowUpButton";
import RequestOfferButton from "./RequestOfferButton";
import { BookOpen, Users, Calendar, Star, Briefcase, AlertCircle } from "lucide-react";

function isoDate(d: Date) { return d.toISOString().split("T")[0]; }

function daysUntilNext(targetDay: number): number {
  const today = new Date().getDay(); // 0=Sun
  const diff = (targetDay - today + 7) % 7;
  return diff === 0 ? 7 : diff;
}

// Next Wednesday (3) or Sunday (0)
function nextCoachingCall(): { label: string; days: number } {
  const daysToWed = daysUntilNext(3);
  const daysToSun = daysUntilNext(0);
  if (daysToWed <= daysToSun) {
    return { label: "Wednesday", days: daysToWed };
  }
  return { label: "Sunday", days: daysToSun };
}

function ScoreBreakdownCard({ breakdown }: { breakdown: Awaited<ReturnType<typeof calculateEchelonScore>> }) {
  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Your Score</p>
          <p className="text-3xl font-extrabold text-[#f0f2f8] mt-1">
            {breakdown.total}<span className="text-[#4b5563] text-lg font-medium">/100</span>
          </p>
        </div>
        <Star className="w-7 h-7 text-amber-400" />
      </div>
      <div className="space-y-2 pt-2 border-t border-[#1e2130]">
        {Object.entries(breakdown.components).map(([key, c]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-xs text-[#6b7280]">{c.label}</span>
            <span className="text-xs font-semibold text-[#9ca3af]">{c.points}<span className="text-[#374151]">/{c.max}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function EchelonDashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { teamId } = await params;
  const admin = createAdminClient();

  // Verify membership
  const { data: membership } = await admin
    .from("team_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership) notFound();

  const member = await getEchelonMemberData(user.id);
  if (!member) notFound();

  const { start: weekStart, end: weekEnd } = (() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(now); mon.setDate(now.getDate() + diff);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { start: isoDate(mon), end: isoDate(sun) };
  })();

  const scoreBreakdown = await calculateEchelonScore(user.id, teamId);

  // ── Learning Phase ──────────────────────────────────────────────────────────

  if (member.phase === "learning") {
    const groupCallCount = await getUserGroupCallCount(user.id, teamId);

    const coaching = nextCoachingCall();

    return (
      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px] space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-semibold text-violet-400/80 uppercase tracking-widest">Learning Phase</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">My Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Course Status */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 space-y-2">
            <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Course Status</p>
            {member.courseComplete ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-emerald-400">Complete ✓</span>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-lg font-extrabold text-amber-400">Incomplete</span>
                <p className="text-xs text-[#6b7280]">Ask your manager to mark your course complete when you finish.</p>
              </div>
            )}
          </div>

          {/* Group Calls Attended */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 space-y-2">
            <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Group Calls Attended</p>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-extrabold text-[#f0f2f8]">{groupCallCount}</span>
              <span className="text-sm text-[#4b5563] mb-1">of 4 required</span>
            </div>
            <div className="h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${Math.min((groupCallCount / 4) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Next Coaching Call */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#4b5563]" />
              <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Next Coaching Call</p>
            </div>
            <p className="text-2xl font-extrabold text-[#f0f2f8]">
              {coaching.days === 1 ? "Tomorrow" : `${coaching.days} days`}
            </p>
            <p className="text-xs text-[#6b7280]">{coaching.label} session</p>
          </div>

          {/* Score */}
          <ScoreBreakdownCard breakdown={scoreBreakdown} />
        </div>
      </div>
    );
  }

  // ── Outreach Phase ──────────────────────────────────────────────────────────

  if (member.phase === "outreach") {
    const [outreachLogs, applications] = await Promise.all([
      getOutreachLogs(user.id, teamId, weekStart, weekEnd),
      getEchelonApplications(user.id, teamId),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const overdueFollowUps = applications.filter(a =>
      !a.followUpDone && a.followUpDate && a.followUpDate <= today
    );
    const pendingFollowUps = applications.filter(a =>
      !a.followUpDone && a.followUpDate
    ).sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? ""));

    return (
      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1000px] space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400/80 uppercase tracking-widest">Outreach Phase</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">My Dashboard</h1>
        </div>

        {/* Overdue follow-ups banner */}
        {overdueFollowUps.length > 0 && (
          <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-300 font-medium">
              {overdueFollowUps.length} overdue follow-up{overdueFollowUps.length !== 1 ? "s" : ""} —
              {" "}{overdueFollowUps.map(a => a.companyName).join(", ")}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Outreach logger */}
            <OutreachLogger teamId={teamId} />

            {/* This week's outreach */}
            {outreachLogs.length > 0 && (
              <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5">
                <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider mb-3">This Week</p>
                <div className="space-y-2">
                  {outreachLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between">
                      <span className="text-xs text-[#6b7280]">{log.logDate}</span>
                      <span className="text-xs font-bold text-[#9ca3af]">{log.count} people</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applications */}
            <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#f0f2f8]">Offer Applications</p>
                <AddApplicationModal teamId={teamId} />
              </div>
              {applications.length === 0 ? (
                <p className="text-xs text-[#6b7280]">No applications logged yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[500px]">
                    <thead>
                      <tr className="border-b border-[#1e2130]">
                        {["Company", "Applied", "Follow-up", "Status"].map(h => (
                          <th key={h} className="pb-2 text-left text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2130]">
                      {applications.map(app => (
                        <tr key={app.id}>
                          <td className="py-2.5 pr-3 text-[#e5e7eb] font-semibold">{app.companyName}</td>
                          <td className="py-2.5 pr-3 text-[#6b7280]">{app.appliedDate}</td>
                          <td className="py-2.5 pr-3 text-[#6b7280]">
                            {app.followUpDate
                              ? <span className={app.followUpDone ? "line-through text-[#374151]" : (app.followUpDate <= today ? "text-rose-400" : "")}>{app.followUpDate}</span>
                              : "—"
                            }
                          </td>
                          <td className="py-2.5 capitalize text-[#9ca3af]">{app.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pending follow-ups */}
            {pendingFollowUps.length > 0 && (
              <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 space-y-3">
                <p className="text-sm font-bold text-[#f0f2f8]">Pending Follow-ups</p>
                <div className="space-y-2">
                  {pendingFollowUps.map(app => (
                    <div key={app.id} className="flex items-center justify-between gap-4 py-2 border-b border-[#1e2130] last:border-0">
                      <div>
                        <p className="text-xs font-semibold text-[#e5e7eb]">{app.companyName}</p>
                        <p className={`text-[11px] ${app.followUpDate && app.followUpDate <= today ? "text-rose-400" : "text-[#6b7280]"}`}>
                          Due: {app.followUpDate}
                          {app.followUpDate && app.followUpDate < today ? " (overdue)" : app.followUpDate === today ? " (today)" : ""}
                        </p>
                      </div>
                      <MarkFollowUpButton applicationId={app.id} teamId={teamId} />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="space-y-4">
            <ScoreBreakdownCard breakdown={scoreBreakdown} />

            {/* Request offer */}
            <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 space-y-3">
              <p className="text-sm font-bold text-[#f0f2f8]">Ready for an Offer?</p>
              <p className="text-xs text-[#6b7280] leading-relaxed">If you&apos;ve joined an offer, let your manager know to unlock your CRM.</p>
              <RequestOfferButton teamId={teamId} alreadyPending={member.offerRequestStatus === "pending"} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── On Offer Phase — redirect to existing setter CRM ───────────────────────

  redirect("/dashboard/crm");
}
