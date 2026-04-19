import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfileFull } from "@/lib/queries";
import ProfilePanel from "@/components/dashboard/ProfilePanel";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const raw     = user ? await getProfileFull(user.id) : null;
  const profile = raw ? {
    ...raw,
    discoverable:    raw.discoverable    ?? false,
    contact_enabled: raw.contact_enabled ?? false,
  } : null;

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[800px]">
      <div className="animate-in flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
          <User className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Profile</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            {profile?.full_name?.trim() || profile?.username
              ? "Your public ApexCard identity."
              : "Set up your public ApexCard identity."}
          </p>
        </div>
      </div>
      <ProfilePanel
        profile={profile}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
      />
    </div>
  );
}
