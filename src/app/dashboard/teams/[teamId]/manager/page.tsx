import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEchelonTeamMembers, getUserGroupCallCount, getUserScore } from "@/lib/echelon-queries";
import { useTeamFeatures } from "@/hooks/useTeamFeatures";
import type { EchelonMemberDetail } from "@/lib/echelon-queries";
import MemberCard from "./MemberCard";
import OfferRequestCard from "./OfferRequestCard";
import { Shield, Users } from "lucide-react";

export default async function EchelonManagerPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { teamId } = await params;
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

  const features = await useTeamFeatures(teamId);
  if (!features.group_call_tracker && !features.crm) notFound();

  const [members, teamRow] = await Promise.all([
    getEchelonTeamMembers(teamId),
    admin.from("teams").select("name").eq("id", teamId).maybeSingle(),
  ]);

  // Enrich members with group call count and score
  const membersDetail: EchelonMemberDetail[] = await Promise.all(
    members.map(async (m) => {
      const [callCount, score] = await Promise.all([
        getUserGroupCallCount(m.userId, teamId),
        getUserScore(m.userId, teamId),
      ]);
      return { ...m, groupCallCount: callCount, score };
    })
  );

  const pendingRequests = membersDetail
    .filter(m => m.offerRequestStatus === "pending")
    .map(m => ({
      userId:      m.userId,
      name:        m.name,
      requestedAt: m.phaseUpdatedAt,
    }));

  const byPhase = {
    learning: membersDetail.filter(m => m.phase === "learning"),
    outreach: membersDetail.filter(m => m.phase === "outreach"),
    on_offer: membersDetail.filter(m => m.phase === "on_offer"),
  };

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1000px] space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400/80 uppercase tracking-widest">Manager Hub</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">
          {teamRow.data?.name ?? "Team"} — Manager Hub
        </h1>
        <p className="text-sm text-[#6b7280] mt-0.5">
          {membersDetail.length} member{membersDetail.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Phase summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Learning",  count: byPhase.learning.length, color: "text-gray-400"    },
          { label: "Outreach",  count: byPhase.outreach.length, color: "text-blue-400"    },
          { label: "On Offer",  count: byPhase.on_offer.length, color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="bg-[#111318] border border-[#1e2130] rounded-xl px-4 py-3">
            <p className="text-[11px] text-[#4b5563] uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Offer requests card */}
      {pendingRequests.length > 0 && (
        <OfferRequestCard requesters={pendingRequests} teamId={teamId} />
      )}

      {/* Members */}
      {membersDetail.length === 0 ? (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center">
          <Users className="w-8 h-8 text-[#374151] mx-auto mb-3" />
          <p className="text-sm text-[#6b7280]">No members in this team yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {membersDetail.map(m => (
            <MemberCard key={m.userId} member={m} teamId={teamId} />
          ))}
        </div>
      )}
    </div>
  );
}
