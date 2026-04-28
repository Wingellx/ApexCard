import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserTeamRole } from "@/lib/queries";
import { getManagedTeams } from "@/lib/crm-queries";
import { getPendingRequestsForManager } from "@/lib/verification-queries";
import CreateTeamForm from "@/components/crm/CreateTeamForm";
import ManagerVerificationPanel from "@/components/verification/ManagerVerificationPanel";
import { Shield, Users, ChevronRight, Clock, CheckCircle, XCircle } from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.FC<{ className?: string }> }> = {
  active:    { label: "Active",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",  icon: CheckCircle },
  pending:   { label: "Pending",   cls: "bg-amber-500/10  text-amber-400  border-amber-500/20",   icon: Clock       },
  suspended: { label: "Declined",  cls: "bg-rose-500/10   text-rose-400   border-rose-500/20",    icon: XCircle     },
};

export default async function CRMManagerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const role = await getUserTeamRole(user.id);
  if (role !== "admin") redirect("/dashboard/crm");

  const [teams, verificationRequests] = await Promise.all([
    getManagedTeams(user.id),
    getPendingRequestsForManager(user.id),
  ]);

  const primaryTeam = teams.find(t => t.is_primary);

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px] space-y-6">

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400/80 uppercase tracking-widest">Manager View</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">My Teams</h1>
        <p className="text-sm text-[#6b7280] mt-0.5">{teams.filter(t => t.status === "active").length} active team{teams.filter(t => t.status === "active").length !== 1 ? "s" : ""}</p>
      </div>

      {/* Team cards */}
      <div className="space-y-3">
        {teams.map(team => {
          const badge  = STATUS_BADGE[team.status] ?? STATUS_BADGE.active;
          const Icon   = badge.icon;
          const isActive = team.status === "active";
          return (
            <div key={team.id} className={`bg-[#111318] border border-[#1e2130] rounded-2xl p-5 ${isActive ? "" : "opacity-70"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#f0f2f8]">{team.name}</h2>
                      {team.is_primary && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider">Primary</span>
                      )}
                    </div>
                    <p className="text-xs text-[#4b5563] mt-0.5">
                      {team.member_count} member{team.member_count !== 1 ? "s" : ""}
                      {team.parent_team_id && !team.is_primary && <span className="ml-2 text-[#374151]">· Sub-team</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border ${badge.cls}`}>
                    <Icon className="w-3 h-3" />
                    {badge.label}
                  </span>
                  {isActive && (
                    <a
                      href={`/dashboard/crm/manager/${team.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-xs font-semibold text-[#9ca3af] hover:text-[#f0f2f8] transition-colors"
                    >
                      Manage <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
              {team.status === "pending" && (
                <p className="mt-3 text-xs text-amber-400/70 pl-14">Waiting for approval — you&apos;ll be able to add members once it&apos;s approved.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Verification requests from reps */}
      {verificationRequests.length > 0 && (
        <ManagerVerificationPanel requests={verificationRequests} />
      )}

      {/* Create sub-team */}
      {primaryTeam && (
        <CreateTeamForm parentTeamName={primaryTeam.name} />
      )}
    </div>
  );
}
