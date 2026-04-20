import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileFull, getLoggedDates, calculateStreak, getUserTeam, getUserTeamRole } from "@/lib/queries";
import { getIsIOmember } from "@/lib/io-queries";
import Sidebar from "@/components/dashboard/Sidebar";

const ROLE_LABELS: Record<string, string> = {
  closer:   "Closer",
  setter:   "Appointment Setter",
  operator: "Growth Operator",
  manager:  "Sales Manager",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile, allDates, userTeam, isIOmember, teamRole] = await Promise.all([
    user ? getProfileFull(user.id)   : Promise.resolve(null),
    user ? getLoggedDates(user.id)   : Promise.resolve([] as string[]),
    user ? getUserTeam(user.id)      : Promise.resolve(null),
    user ? getIsIOmember(user.id)    : Promise.resolve(false),
    user ? getUserTeamRole(user.id)  : Promise.resolve(null),
  ]);

  if (profile && !profile.onboarding_completed) redirect("/onboarding");
  if (profile?.account_type === "owner") redirect("/owner");

  const subStatus   = profile?.subscription_status ?? "trialing";
  const trialEndsAt = profile?.trial_ends_at;
  const trialExpired = trialEndsAt ? new Date(trialEndsAt) < new Date() : false;
  const showUpgradeBanner =
    subStatus === "canceled" || subStatus === "unpaid" ||
    (subStatus === "trialing" && trialExpired);

  const streak      = calculateStreak(allDates);
  const rawName     = profile?.full_name?.trim() || profile?.email?.split("@")[0] || user?.email?.split("@")[0] || "User";
  const userName    = rawName;
  const userEmail   = profile?.email ?? user?.email ?? "";
  const userRole    = ROLE_LABELS[profile?.role ?? ""] ?? "Sales Rep";
  const userInitial = rawName[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-[#0a0b0f]">
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        userInitial={userInitial}
        streak={streak}
        teamId={userTeam?.teamId ?? null}
        isIOmember={isIOmember}
        isTeamAdmin={teamRole === "admin"}
      />
      <div className="lg:ml-64 pt-14 lg:pt-0">
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
