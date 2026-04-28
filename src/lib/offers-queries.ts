import { createAdminClient } from "@/lib/supabase/admin";

export type OfferRoleType = "dm_setter" | "dialling" | "closing";
export type B2BorB2C = "b2b" | "b2c" | "both";
export type ApplicationStatus = "submitted" | "viewed" | "accepted" | "declined";

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
  posted_by: string | null;
  created_at: string;
  expires_at: string | null;
  requires_verified: boolean;
  min_cash_collected: number | null;
  min_close_rate: number | null;
  b2b_b2c: B2BorB2C | null;
  application_limit: number;
  application_count: number;
}

export interface UserEligibility {
  isVerified: boolean;
  verificationActive: boolean;
  lifetimeCash: number;
  closeRate: number;
  daysLogged: number;
}

export interface OfferApplication {
  id: string;
  offer_id: string;
  user_id: string;
  status: ApplicationStatus;
  cover_note: string | null;
  applied_at: string;
  expires_at: string;
  offer_title: string;
  offer_company: string;
}

export interface OwnerApplication {
  id: string;
  offer_id: string;
  offer_title: string;
  offer_company: string;
  user_id: string;
  rep_name: string;
  rep_email: string;
  rep_username: string | null;
  rep_is_verified: boolean;
  rep_verification_active: boolean;
  rep_lifetime_cash: number;
  rep_close_rate: number;
  rep_days_logged: number;
  rep_total_closed: number;
  status: ApplicationStatus;
  cover_note: string | null;
  applied_at: string;
  expires_at: string;
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getOffers(): Promise<Offer[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("offers")
    .select(
      "id, title, company_name, role_type, niche, commission_pct, base_pay, description, requirements, application_url, is_active, is_featured, team_id, posted_by, created_at, expires_at, requires_verified, min_cash_collected, min_close_rate, b2b_b2c, application_limit, application_count"
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  return (data ?? []).map(r => ({
    ...r,
    requires_verified:  r.requires_verified  ?? false,
    min_cash_collected: r.min_cash_collected  ?? null,
    min_close_rate:     r.min_close_rate      ?? null,
    b2b_b2c:            (r.b2b_b2c as B2BorB2C | null) ?? null,
    application_limit:  r.application_limit   ?? 50,
    application_count:  r.application_count   ?? 0,
    posted_by:          r.posted_by           ?? null,
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
    daysLogged:         (logs ?? []).length,
  };
}

export async function getUserSavedOfferIds(userId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("saved_offers")
    .select("offer_id")
    .eq("user_id", userId);
  return (data ?? []).map(r => r.offer_id as string);
}

export async function getMyApplications(userId: string): Promise<OfferApplication[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("offer_applications")
    .select("id, offer_id, user_id, status, cover_note, applied_at, expires_at, offers(title, company_name)")
    .eq("user_id", userId)
    .order("applied_at", { ascending: false });

  type AppRow = {
    id: string;
    offer_id: string;
    user_id: string;
    status: ApplicationStatus;
    cover_note: string | null;
    applied_at: string;
    expires_at: string;
    offers: { title: string; company_name: string } | null;
  };

  return (data ?? []).map(r => {
    const row = r as unknown as AppRow;
    return {
      id:            row.id,
      offer_id:      row.offer_id,
      user_id:       row.user_id,
      status:        row.status,
      cover_note:    row.cover_note,
      applied_at:    row.applied_at,
      expires_at:    row.expires_at,
      offer_title:   row.offers?.title        ?? "Unknown Offer",
      offer_company: row.offers?.company_name ?? "",
    };
  });
}

export async function getOwnerApplications(ownerUserId: string): Promise<OwnerApplication[]> {
  const admin = createAdminClient();

  const { data: ownerOffers } = await admin
    .from("offers")
    .select("id, title, company_name")
    .eq("posted_by", ownerUserId);

  if (!ownerOffers?.length) return [];

  const offerIds = ownerOffers.map(o => o.id as string);

  const { data: apps } = await admin
    .from("offer_applications")
    .select("id, offer_id, user_id, status, cover_note, applied_at, expires_at, profiles(full_name, email, username, is_verified, verification_active)")
    .in("offer_id", offerIds)
    .order("applied_at", { ascending: false });

  if (!apps?.length) return [];

  type AppRow = {
    id: string;
    offer_id: string;
    user_id: string;
    status: ApplicationStatus;
    cover_note: string | null;
    applied_at: string;
    expires_at: string;
    profiles: { full_name: string | null; email: string | null; username: string | null; is_verified: boolean | null; verification_active: boolean | null } | null;
  };

  const typedApps = apps as unknown as AppRow[];
  const repIds    = [...new Set(typedApps.map(a => a.user_id))];

  const { data: logData } = await admin
    .from("call_logs")
    .select("user_id, shows, offers_taken, cash_collected")
    .in("user_id", repIds);

  const repStats = new Map<string, { cash: number; closeRate: number; daysLogged: number; totalClosed: number }>();
  for (const repId of repIds) {
    const repLogs = (logData ?? []).filter(l => l.user_id === repId);
    const cash    = repLogs.reduce((a, l) => a + Number(l.cash_collected ?? 0), 0);
    const shows   = repLogs.reduce((a, l) => a + (l.shows        ?? 0), 0);
    const closed  = repLogs.reduce((a, l) => a + (l.offers_taken ?? 0), 0);
    repStats.set(repId, {
      cash,
      closeRate:   shows > 0 ? (closed / shows) * 100 : 0,
      daysLogged:  repLogs.length,
      totalClosed: closed,
    });
  }

  const offerMap = new Map(ownerOffers.map(o => [o.id as string, o]));

  return typedApps.map(app => {
    const offer = offerMap.get(app.offer_id);
    const stats = repStats.get(app.user_id) ?? { cash: 0, closeRate: 0, daysLogged: 0, totalClosed: 0 };
    return {
      id:                      app.id,
      offer_id:                app.offer_id,
      offer_title:             offer?.title        ?? "Unknown Offer",
      offer_company:           offer?.company_name ?? "",
      user_id:                 app.user_id,
      rep_name:                app.profiles?.full_name            ?? "Unknown Rep",
      rep_email:               app.profiles?.email                ?? "",
      rep_username:            app.profiles?.username             ?? null,
      rep_is_verified:         app.profiles?.is_verified          ?? false,
      rep_verification_active: app.profiles?.verification_active  ?? false,
      rep_lifetime_cash:       stats.cash,
      rep_close_rate:          stats.closeRate,
      rep_days_logged:         stats.daysLogged,
      rep_total_closed:        stats.totalClosed,
      status:                  app.status,
      cover_note:              app.cover_note,
      applied_at:              app.applied_at,
      expires_at:              app.expires_at,
    };
  });
}
