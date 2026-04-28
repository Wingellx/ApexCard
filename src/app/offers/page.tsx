import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileFull } from "@/lib/queries";
import { getOffers, getUserEligibility } from "@/lib/offers-queries";
import { getSBOAdminMode } from "@/lib/preview";
import OfferBoard from "./OfferBoard";
import SBOAdminBanner from "@/components/owner/SBOAdminBanner";
import PostOfferForm from "@/app/owner/PostOfferForm";

export default async function OffersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profile, isSBOAdmin] = await Promise.all([
    getProfileFull(user.id),
    getSBOAdminMode(),
  ]);

  if (!profile) redirect("/auth/login");
  if (profile.account_type !== "owner" && !profile.onboarding_completed) redirect("/onboarding");

  const [offers, eligibility] = await Promise.all([
    getOffers(),
    getUserEligibility(user.id),
  ]);

  return (
    <div className="min-h-screen bg-[#080a0e]">
      {isSBOAdmin && <SBOAdminBanner />}
      {isSBOAdmin && (
        <div className="max-w-3xl mx-auto px-6 pt-8">
          <PostOfferForm />
        </div>
      )}
      <OfferBoard offers={offers} userUsername={profile.username ?? null} userEligibility={eligibility} />
    </div>
  );
}
