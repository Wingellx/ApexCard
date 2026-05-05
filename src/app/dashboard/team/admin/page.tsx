import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserTeam, getUserTeamRole, getAdminTeamData } from "@/lib/queries";
import { getTeamInviteTokens } from "@/lib/invite-queries";
import { setMemberTrainingSplit, removeMember } from "./actions";
import { Shield, Users, Flame, PhoneCall, Calendar, Trash2 } from "lucide-react";
import AdminMemberCard from "./AdminMemberCard";
import InviteLinksPanel from "@/components/teams/InviteLinksPanel";

const ROLE_LABELS: Record<string, string> = {
  closer:   "Closer",
  setter:   "Setter",
  operator: "Operator",
  manager:  "Manager",
};

const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default async function TeamAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [role, userTeam] = await Promise.all([
    getUserTeamRole(user.id),
    getUserTeam(user.id),
  ]);

  if (role !== "admin" || !userTeam) redirect("/dashboard/team");

  const [members, inviteTokens] = await Promise.all([
    getAdminTeamData(userTeam.teamId),
    getTeamInviteTokens(userTeam.teamId),
  ]);

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px] space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400/80 uppercase tracking-widest">Admin Panel</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">{userTeam.team.name}</h1>
        <p className="text-sm text-[#6b7280] mt-0.5">
          {members.length} member{members.length !== 1 ? "s" : ""} · Set training splits and manage the roster.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-[#4b5563]">
        <div className="flex items-center gap-1.5"><Flame className="w-3 h-3" /> Debriefs (7d)</div>
        <div className="flex items-center gap-1.5"><PhoneCall className="w-3 h-3" /> Calls (7d)</div>
        <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Training split</div>
      </div>

      {/* Invite links */}
      <InviteLinksPanel
        ownerToken={inviteTokens.ownerToken}
        managerToken={inviteTokens.managerToken}
        memberToken={inviteTokens.memberToken}
        viewerRole="admin"
      />

      {/* Members */}
      {members.length === 0 ? (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center">
          <Users className="w-8 h-8 text-[#374151] mx-auto mb-3" />
          <p className="text-[#6b7280]">No members yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(member => (
            <AdminMemberCard
              key={member.userId}
              member={member}
              isSelf={member.userId === user.id}
              dayLabels={DAY_FULL}
              roleLabels={ROLE_LABELS}
            />
          ))}
        </div>
      )}
    </div>
  );
}
