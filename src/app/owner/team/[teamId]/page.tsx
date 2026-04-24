import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfileFull, getOwnerTeamDetail } from "@/lib/queries";
import CopyInviteButton from "@/components/owner/CopyInviteButton";
import CloserCrmPanel from "@/components/owner/CloserCrmPanel";
import { signout } from "@/app/auth/actions";
import {
  ArrowLeft, Shield, Users, ChevronRight,
  Crown, User, BarChart3, ExternalLink,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  closer:        "Closer",
  setter:        "Setter",
  operator:      "Operator",
  manager:       "Manager",
  sales_manager: "Sales Manager",
  offer_owner:   "Offer Owner",
};

const TIER_LABELS: Record<number, string> = { 1: "Tier 1", 2: "Tier 2", 3: "Tier 3" };

const STATUS_STYLES: Record<string, string> = {
  active:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  pending:   "text-amber-400  bg-amber-500/10  border-amber-500/20",
  declined:  "text-red-400    bg-red-500/10    border-red-500/20",
  suspended: "text-red-400    bg-red-500/10    border-red-500/20",
};

export default async function OwnerTeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await getProfileFull(user.id);
  if (!profile || profile.account_type !== "owner" || !profile.verified_owner) {
    redirect("/owner");
  }

  const team = await getOwnerTeamDetail(teamId);
  if (!team) notFound();

  return (
    <div className="min-h-screen bg-[#080a0e]">

      {/* Header */}
      <div className="border-b border-white/[0.04] bg-[#0b0d12]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href={team.parentId ? `/owner/team/${team.parentId}` : "/owner"}
              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-[#6b7280]" />
            </Link>
            <div className="min-w-0">
              {team.parentName && (
                <p className="text-[11px] text-[#4b5563] mb-0.5">
                  <Link href={`/owner/team/${team.parentId}`} className="hover:text-[#6b7280] transition-colors">
                    {team.parentName}
                  </Link>
                  {" / "}
                  <span className="text-[#6b7280]">{team.name}</span>
                </p>
              )}
              <h1 className="text-base font-extrabold text-[#f0f2f8] tracking-tight leading-none truncate">
                {team.name}
              </h1>
              <p className="text-[11px] text-[#4b5563] mt-0.5">
                {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                {team.subTeams.length > 0 && ` · ${team.subTeams.length} sub-team${team.subTeams.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {team.tier && (
              <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                {TIER_LABELS[team.tier] ?? `Tier ${team.tier}`}
              </span>
            )}
            {team.status && team.status !== "active" && (
              <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[team.status] ?? ""}`}>
                {team.status}
              </span>
            )}
            <form action={signout}>
              <button type="submit" className="text-xs text-[#374151] hover:text-[#6b7280] transition-colors font-medium">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">

        {/* Description + invite */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1">
            {team.description ? (
              <p className="text-sm text-[#6b7280] leading-relaxed">{team.description}</p>
            ) : (
              <p className="text-sm text-[#374151] italic">No description.</p>
            )}
            {team.division && (
              <div className="flex items-center gap-1.5 mt-2">
                <BarChart3 className="w-3 h-3 text-[#4b5563]" />
                <span className="text-[11px] text-[#4b5563] capitalize">{team.division} division</span>
              </div>
            )}
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <CopyInviteButton teamId={team.id} />
          </div>
        </div>

        {/* Sub-teams */}
        {team.subTeams.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-3.5 h-3.5 text-indigo-400/60" />
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">
                Sub-teams ({team.subTeams.length})
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.subTeams.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/owner/team/${sub.id}`}
                  className="group bg-[#0f1117] border border-[#1e2130] hover:border-indigo-500/30 rounded-2xl p-5 flex flex-col gap-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#f0f2f8] truncate group-hover:text-indigo-300 transition-colors">
                          {sub.name}
                        </p>
                        <p className="text-[11px] text-[#4b5563] mt-0.5">
                          {sub.memberCount} member{sub.memberCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.status && sub.status !== "active" && (
                        <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[sub.status] ?? ""}`}>
                          {sub.status}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-[#374151] group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                  {sub.description && (
                    <p className="text-xs text-[#6b7280] line-clamp-2">{sub.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Members */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-3.5 h-3.5 text-[#4b5563]" />
            <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">
              Members ({team.memberCount})
            </p>
          </div>

          {team.members.length === 0 ? (
            <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl py-12 text-center">
              <Users className="w-8 h-8 text-[#1e2130] mx-auto mb-3" />
              <p className="text-sm text-[#374151]">No members yet</p>
              <p className="text-xs text-[#2d3147] mt-1">Share an invite link to add people.</p>
            </div>
          ) : (
            <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl overflow-hidden">
              {team.members.map((member, i) => (
                <div
                  key={member.userId}
                  className={i > 0 ? "border-t border-white/[0.04]" : ""}
                >
                <div className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-indigo-500/15 border border-violet-500/15 flex items-center justify-center shrink-0">
                      {member.teamRole === "admin"
                        ? <Crown className="w-3.5 h-3.5 text-amber-400" />
                        : <User  className="w-3.5 h-3.5 text-[#6b7280]" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#f0f2f8] truncate">
                        {member.name ?? "Unknown"}
                      </p>
                      {member.username && (
                        <p className="text-[11px] text-[#4b5563]">@{member.username}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {member.role && (
                      <span className="text-[10px] font-semibold text-[#374151] bg-[#1a1d28] border border-[#1e2130] px-2 py-0.5 rounded-full">
                        {ROLE_LABELS[member.role] ?? member.role}
                      </span>
                    )}
                    {member.teamRole === "admin" && (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        Manager
                      </span>
                    )}
                    {member.username && (
                      <Link
                        href={`/card/${member.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg bg-white/[0.03] hover:bg-indigo-500/[0.08] border border-white/[0.06] hover:border-indigo-500/20 flex items-center justify-center transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-[#4b5563] hover:text-indigo-400" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Closer CRM panel — shows today's custom log fields */}
                {member.role === "closer" && (
                  <div className="px-5 pb-3">
                    <CloserCrmPanel memberId={member.userId} memberName={member.name ?? "Closer"} />
                  </div>
                )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
