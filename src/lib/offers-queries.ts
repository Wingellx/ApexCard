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
  team_id: string | null;
  created_at: string;
  expires_at: string | null;
}

export async function getOffers(): Promise<Offer[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("offers")
    .select(
      "id, title, company_name, role_type, niche, commission_pct, base_pay, description, requirements, application_url, is_active, is_featured, team_id, created_at, expires_at"
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as Offer[];
}
