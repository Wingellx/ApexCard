import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileFull } from "@/lib/queries";
import { getOffers, getUserEligibility, getUserSavedOfferIds, getMyApplications } from "@/lib/offers-queries";
import OfferBoard from "./OfferBoard";

export default async function OffersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await getProfileFull(user.id);

  if (!profile) redirect("/auth/login");
  if (profile.account_type !== "owner" && !profile.onboarding_completed) redirect("/onboarding");

  const [offers, eligibility, savedOfferIds, myApplications] = await Promise.all([
    getOffers(),
    getUserEligibility(user.id),
    getUserSavedOfferIds(user.id),
    getMyApplications(user.id),
  ]);

  const userStats = {
    name:               profile.full_name?.trim() || profile.email?.split("@")[0] || "Sales Pro",
    role:               profile.role ?? null,
    username:           profile.username ?? null,
    isVerified:         (profile as Record<string, unknown>).is_verified === true,
    verificationActive: (profile as Record<string, unknown>).verification_active === true,
  };

  return (
    <div className="min-h-screen bg-[#080a0e]">
      <OfferBoard
        offers={offers}
        eligibility={eligibility}
        savedOfferIds={savedOfferIds}
        myApplications={myApplications}
        userStats={userStats}
        userId={user.id}
      />
    </div>
  );
}
