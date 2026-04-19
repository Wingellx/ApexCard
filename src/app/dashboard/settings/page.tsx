import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileFull } from "@/lib/queries";
import SettingsPanel from "@/components/dashboard/SettingsPanel";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfileFull(user.id);

  const fullName = profile?.full_name?.trim() || "";
  const email    = profile?.email ?? user.email ?? "";

  return (
    <div className="px-4 sm:px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">Settings</h1>
        <p className="text-sm text-[#6b7280] mt-1">Manage your account and security preferences.</p>
      </div>
      <SettingsPanel fullName={fullName} email={email} />
    </div>
  );
}
