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
  // Gating requirements
  requires_verified: boolean;
  min_cash_collected: number | null;
  min_close_rate: number | null;
}

export interface UserEligibility {
  isVerified: boolean;
  verificationActive: boolean;
  lifetimeCash: number;
  closeRate: number;  // 0–100
}

export async function getOffers(): Promise<Offer[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("offers")
    .select(
      "id, title, company_name, role_type, niche, commission_pct, base_pay, description, requirements, application_url, is_active, is_featured, team_id, created_at, expires_at, requires_verified, min_cash_collected, min_close_rate"
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map(r => ({
    ...r,
    requires_verified:  r.requires_verified  ?? false,
    min_cash_collected: r.min_cash_collected  ?? null,
    min_close_rate:     r.min_close_rate      ?? null,
  })) as Offer[];
}

export async function getUserEligibility(userId: string): Promise<UserEligibility> {
  const admin = createAdminClient();

  const [{ data: profile }, { data: logs }] = await Promise.all([
    admin.from("profiles").select("is_verified, verification_active").eq("id", userId).maybeSingle(),
    admin.from("call_logs").select("shows, offers_taken, cash_collected").eq("user_id", userId),
  ]);

  const totals = (logs ?? []).reduce(
    (a, r) => ({
      shows:  a.shows  + (r.shows        ?? 0),
      closed: a.closed + (r.offers_taken ?? 0),
      cash:   a.cash   + Number(r.cash_collected ?? 0),
    }),
    { shows: 0, closed: 0, cash: 0 }
  );

  return {
    isVerified:         profile?.is_verified          ?? false,
    verificationActive: (profile as { verification_active?: boolean } | null)?.verification_active ?? false,
    lifetimeCash:       totals.cash,
    closeRate:          totals.shows > 0 ? (totals.closed / totals.shows) * 100 : 0,
  };
}
