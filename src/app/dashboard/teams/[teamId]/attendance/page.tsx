import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { useTeamFeatures } from "@/hooks/useTeamFeatures";
import { getEchelonTeamMembers, getGroupCallAttendance, getWeekSessions } from "@/lib/echelon-queries";
import AttendanceTable from "./AttendanceTable";
import { Users, ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params:       Promise<{ teamId: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { teamId } = await params;
  const sp = await searchParams;
  const weekOffset = parseInt(sp.week ?? "0", 10);

  const admin = createAdminClient();

  // Gate: manager only
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || !["admin", "offer_owner"].includes(membership.role as string)) {
    notFound();
  }

  // Check feature flag
  const features = await useTeamFeatures(teamId);
  if (!features.group_call_tracker) notFound();

  // Build session dates for the selected week
  const { wednesday, sunday, weekStart, weekEnd } = getWeekSessions(weekOffset);

  const sessions = [
    { date: wednesday, day: "wednesday", label: "Wednesday" },
    { date: sunday,    day: "sunday",    label: "Sunday"    },
  ];

  const [members, attendanceMap] = await Promise.all([
    getEchelonTeamMembers(teamId),
    getGroupCallAttendance(teamId, [wednesday, sunday]),
  ]);

  // Convert to a nested map: userId → { date → boolean }
  const attended: Record<string, Record<string, boolean>> = {};
  for (const m of members) {
    attended[m.userId] = {};
    for (const s of sessions) {
      attended[m.userId][s.date] = attendanceMap.get(m.userId)?.has(s.date) ?? false;
    }
  }

  const { data: teamRow } = await admin
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .maybeSingle();

  function weekLabel() {
    const mon = new Date(weekStart + "T00:00:00");
    const sun = new Date(weekEnd   + "T00:00:00");
    const o: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${mon.toLocaleDateString("en-US", o)} – ${sun.toLocaleDateString("en-US", o)}`;
  }

  const prevWeek = weekOffset - 1;
  const nextWeek = weekOffset + 1;
  const canGoNext = weekOffset < 0;

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1100px] space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400/80 uppercase tracking-widest">Group Call Attendance</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">
          {teamRow?.name ?? "Team"} — Attendance
        </h1>
        <p className="text-sm text-[#6b7280] mt-0.5">
          {members.length} member{members.length !== 1 ? "s" : ""} · Wednesday &amp; Sunday sessions
        </p>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-3">
        <Link
          href={`?week=${prevWeek}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#111318] border border-[#1e2130] text-[#9ca3af] hover:text-[#f0f2f8] text-xs font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Link>
        <span className="text-sm font-semibold text-[#f0f2f8]">
          {weekOffset === 0 ? "This week" : weekOffset === -1 ? "Last week" : `${Math.abs(weekOffset)} weeks ago`}
          {" "}({weekLabel()})
        </span>
        {canGoNext && (
          <Link
            href={`?week=${nextWeek}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#111318] border border-[#1e2130] text-[#9ca3af] hover:text-[#f0f2f8] text-xs font-semibold transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Attendance table */}
      {members.length === 0 ? (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center">
          <Users className="w-8 h-8 text-[#374151] mx-auto mb-3" />
          <p className="text-sm text-[#6b7280]">No members in this team yet.</p>
        </div>
      ) : (
        <AttendanceTable
          teamId={teamId}
          members={members}
          sessions={sessions}
          attended={attended}
        />
      )}
    </div>
  );
}
