import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileFull } from "@/lib/queries";
import { getIsSetByOffersMember, getSetByOffers } from "@/lib/offers-queries";
import { getSBOAdminMode } from "@/lib/preview";
import OfferBoard from "./OfferBoard";
import SBOAdminBanner from "@/components/owner/SBOAdminBanner";
import PostOfferForm from "@/app/owner/PostOfferForm";

export default async function OffersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profile, isMember, isSBOAdmin] = await Promise.all([
    getProfileFull(user.id),
    getIsSetByOffersMember(user.id),
    getSBOAdminMode(),
  ]);

  if (!profile) redirect("/auth/login");
  if (profile.account_type !== "owner" && !profile.onboarding_completed) redirect("/onboarding");
  if (!isMember && !isSBOAdmin) redirect("/dashboard");

  const offers = await getSetByOffers();

  return (
    <div className="min-h-screen bg-[#080a0e]">
      {isSBOAdmin && <SBOAdminBanner />}
      {isSBOAdmin && (
        <div className="max-w-3xl mx-auto px-6 pt-8">
          <PostOfferForm />
        </div>
      )}
      <OfferBoard offers={offers} userUsername={profile.username ?? null} />
    </div>
  );
}
