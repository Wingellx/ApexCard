import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileFull } from "@/lib/queries";
import { getIsSetByOffersMember, getSetByOffers } from "@/lib/offers-queries";
import OfferBoard from "./OfferBoard";

export default async function OffersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [profile, isMember] = await Promise.all([
    getProfileFull(user.id),
    getIsSetByOffersMember(user.id),
  ]);

  if (!profile) redirect("/auth/login");
  if (profile.account_type !== "owner" && !profile.onboarding_completed) redirect("/onboarding");
  if (!isMember) redirect("/dashboard");

  const offers = await getSetByOffers();

  return (
    <OfferBoard offers={offers} userUsername={profile.username ?? null} />
  );
}
