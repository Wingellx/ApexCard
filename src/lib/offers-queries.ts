import { createAdminClient } from "@/lib/supabase/admin";

export type OfferRoleType = "dm_setter" | "dialling" | "closing";

export interface Offer {
  id: string;
  title: string;
  company_name: string;
  role_type: OfferRoleType;
  niche: string;
  commission_pct: number | null;
  base_pay: number | null;
  description: string;
  requirements: string;
  application_url: string;
  is_active: boolean;
  is_featured: boolean;
  team_id: string;
  created_at: string;
  expires_at: string | null;
}

export async function getSetByOffersTeamId(): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("teams")
    .select("id")
    .eq("name", "SetByOffers")
    .maybeSingle();
  return (data?.id as string) ?? null;
}

export async function getIsSetByOffersMember(userId: string): Promise<boolean> {
  const teamId = await getSetByOffersTeamId();
  if (!teamId) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function getSetByOffers(): Promise<Offer[]> {
  const teamId = await getSetByOffersTeamId();
  if (!teamId) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("offers")
    .select(
      "id, title, company_name, role_type, niche, commission_pct, base_pay, description, requirements, application_url, is_active, is_featured, team_id, created_at, expires_at"
    )
    .eq("team_id", teamId)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as Offer[];
}
