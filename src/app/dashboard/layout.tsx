import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileFull, getLoggedDates, calculateStreak, getUserTeam, getUserTeamRole } from "@/lib/queries";
import { getIsIOmember } from "@/lib/io-queries";
import { getPreviewRole, previewRoleLabel } from "@/lib/preview";
import { getUserCustomFeature } from "@/lib/queries";
import { useTeamFeatures } from "@/hooks/useTeamFeatures";
import { getEchelonMemberData } from "@/lib/echelon-queries";
import { createAdminClient } from "@/lib/supabase/admin";
import Sidebar from "@/components/dashboard/Sidebar";
import type { EchelonNavProps } from "@/components/dashboard/Sidebar";
import PreviewBanner from "@/components/owner/PreviewBanner";
import TeamMemberBanner from "@/components/dashboard/TeamMemberBanner";

const ROLE_LABELS: Record<string, string> = {
  closer:        "Closer",
  setter:        "Appointment Setter",
  operator:      "Growth Operator",
  manager:       "Sales Manager",
  sales_manager: "Sales Manager",
  offer_owner:   "Offer Owner",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const previewRole = await getPreviewRole();

  const [profile, allDates, userTeam, isIOmember, teamRole, hasKPIDashboard] = await Promise.all([
    getProfileFull(user.id),
    getLoggedDates(user.id),
    getUserTeam(user.id),
    getIsIOmember(user.id),
    getUserTeamRole(user.id),
    getUserCustomFeature(user.id, "closing_kpi_dashboard"),
  ]);

  // Detect Echelon membership — any team member whose team has a team_features row
  let echelonNav: EchelonNavProps | null = null;
  if (profile?.account_type === "team_member" && userTeam?.teamId) {
    const features = await useTeamFeatures(userTeam.teamId);
    const hasAnyFeature = Object.values(features).some(Boolean);
    if (hasAnyFeature) {
      const echelonMember = await getEchelonMemberData(user.id);
      // Check if user is a manager for this Echelon team
      const admin = createAdminClient();
      const { data: memberRow } = await admin
        .from("team_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("team_id", userTeam.teamId)
        .maybeSingle();
      const isEchelonManager = ["admin", "offer_owner"].includes((memberRow?.role as string) ?? "");
      echelonNav = {
        echelonTeamId:    userTeam.teamId,
        echelonPhase:     echelonMember?.phase ?? "learning",
        isEchelonManager,
        features: {
          leaderboard:       features.leaderboard,
          group_call_tracker: features.group_call_tracker,
        },
      };
    }
  }

  if (!profile || !profile.onboarding_completed) redirect("/onboarding");

  // Owners are redirected to /owner unless they have an active preview session
  if (profile.account_type === "owner" && !previewRole) redirect("/owner");

  const isTeamMember = profile.account_type === "team_member";

  const isPreview = profile.account_type === "owner" && !!previewRole;

  const subStatus    = profile.subscription_status ?? "trialing";
  const trialEndsAt  = profile.trial_ends_at;
  const trialExpired = trialEndsAt ? new Date(trialEndsAt) < new Date() : false;
  const showUpgradeBanner =
    !isPreview &&
    !isTeamMember &&
    (subStatus === "canceled" || subStatus === "unpaid" ||
     (subStatus === "trialing" && trialExpired));

  const rawName     = profile.full_name?.trim() || profile.email?.split("@")[0] || user.email?.split("@")[0] || "User";
  const userEmail   = profile.email ?? user.email ?? "";
  const userInitial = rawName[0]?.toUpperCase() ?? "U";

  // In preview mode, use the preview role label; otherwise use the real role
  const effectiveRole = isPreview ? previewRole! : (profile.role ?? null);
  const userRole = isPreview
    ? previewRoleLabel(previewRole!)
    : (ROLE_LABELS[profile.role ?? ""] ?? "Sales Rep");

  // In preview mode, show a limited rep-like nav (no team/CRM/IO — owner has none)
  // Team members get limited nav: only CRM, stats, and team
  const effectiveTeamId    = isPreview ? null : (userTeam?.teamId ?? null);
  const effectiveIOmember  = isPreview ? false : isIOmember;
  const effectiveTeamAdmin = isPreview ? false : teamRole === "admin";
  const effectiveCRM       = isPreview ? false : !!userTeam;

  const streak = calculateStreak(allDates);

  return (
    <div className="min-h-screen bg-[#0a0b0f]">
      <Sidebar
        userName={rawName}
        userEmail={userEmail}
        userRole={userRole}
        userInitial={userInitial}
        streak={streak}
        teamId={effectiveTeamId}
        isIOmember={effectiveIOmember}
        isTeamAdmin={effectiveTeamAdmin}
        isCRMenabled={effectiveCRM}
        role={effectiveRole}
        hasKPIDashboard={isPreview ? false : hasKPIDashboard}
        isTeamMember={isTeamMember}
        echelon={isPreview ? null : echelonNav}
      />
      <div className="lg:ml-64 pt-14 lg:pt-0">
        {isPreview && <PreviewBanner role={previewRole!} />}
        {isTeamMember && userTeam && (
          <TeamMemberBanner teamName={userTeam.team.name} />
        )}
        {showUpgradeBanner && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-rose-300 font-medium">
              {subStatus === "trialing" ? "Your 14-day free trial has expired." : "Your subscription requires attention."}
            </p>
            <Link
              href="/dashboard/upgrade"
              className="shrink-0 text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Upgrade now →
            </Link>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
