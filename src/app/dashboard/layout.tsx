import { createClient } from "@/lib/supabase/server";
import { getProfileFull, getLoggedDates, calculateStreak } from "@/lib/queries";
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

  const [profile, allDates] = await Promise.all([
    user ? getProfileFull(user.id) : Promise.resolve(null),
    user ? getLoggedDates(user.id) : Promise.resolve([] as string[]),
  ]);

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
      />
      <div className="lg:ml-64 pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
