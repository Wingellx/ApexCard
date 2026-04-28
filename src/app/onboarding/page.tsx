import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { getIsIOmember } from "@/lib/io-queries";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: profile }, isIOmember] = await Promise.all([
    supabase.from("profiles").select("onboarding_completed").eq("id", user.id).maybeSingle(),
    getIsIOmember(user.id),
  ]);

  if (profile?.onboarding_completed) redirect("/dashboard");

  return <OnboardingFlow showTracking={isIOmember} />;
}
