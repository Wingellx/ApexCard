import { createAdminClient } from "@/lib/supabase/admin";

export type VerificationRequestType = "manager" | "owner";
export type VerificationStatus = "pending" | "approved" | "declined";

export interface RepVerificationRequest {
  id: string;
  user_id: string;
  requested_from: string;
  request_type: VerificationRequestType;
  proof_url: string | null;
  proof_notes: string | null;
  status: VerificationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface RepVerificationRequestWithRep extends RepVerificationRequest {
  rep_name: string;
  rep_email: string;
  rep_username: string | null;
  // lifetime stats from call_logs
  lifetime_cash: number;
  lifetime_calls: number;
  lifetime_closed: number;
  close_rate: number;
  days_logged: number;
}

export interface ApprovedManager {
  id: string;
  name: string;
  email: string;
  username: string | null;
  team_name: string | null;
}

// ── Rep: get own verification status ─────────────────────────────────────────

export async function getMyRepVerification(userId: string): Promise<{
  status: "none" | VerificationStatus;
  request: RepVerificationRequest | null;
  reviewerName: string | null;
}> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rep_verification_requests")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { status: "none", request: null, reviewerName: null };

  let reviewerName: string | null = null;
  if (data.reviewed_by) {
    const { data: reviewer } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", data.reviewed_by)
      .maybeSingle();
    reviewerName = reviewer?.full_name ?? null;
  } else if (data.requested_from) {
    const { data: reviewer } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", data.requested_from)
      .maybeSingle();
    reviewerName = reviewer?.full_name ?? null;
  }

  return {
    status: data.status as VerificationStatus,
    request: data as RepVerificationRequest,
    reviewerName,
  };
}

// ── Managers available for verification requests ──────────────────────────────

export async function getApprovedManagers(): Promise<ApprovedManager[]> {
  const admin = createAdminClient();

  // Team admins
  const { data: admins } = await admin
    .from("team_members")
    .select("user_id, teams(name), profiles(full_name, email, username)")
    .eq("role", "admin");

  const seen = new Set<string>();
  const managers: ApprovedManager[] = [];

  for (const row of (admins ?? []) as unknown as {
    user_id: string;
    teams: { name: string } | null;
    profiles: { full_name: string | null; email: string | null; username: string | null } | null;
  }[]) {
    if (seen.has(row.user_id)) continue;
    seen.add(row.user_id);
    if (!row.profiles?.full_name) continue;
    managers.push({
      id:        row.user_id,
      name:      row.profiles.full_name,
      email:     row.profiles.email ?? "",
      username:  row.profiles.username ?? null,
      team_name: row.teams?.name ?? null,
    });
  }

  return managers.sort((a, b) => a.name.localeCompare(b.name));
}

// ── Helper: get rep's lifetime stats from call_logs ───────────────────────────

async function getRepLifetimeStats(userId: string) {
  const admin = createAdminClient();
  const { data: logs } = await admin
    .from("call_logs")
    .select("calls_taken, shows, offers_taken, cash_collected")
    .eq("user_id", userId);

  const totals = (logs ?? []).reduce(
    (a, r) => ({
      calls:   a.calls   + (r.calls_taken  ?? 0),
      shows:   a.shows   + (r.shows        ?? 0),
      closed:  a.closed  + (r.offers_taken ?? 0),
      cash:    a.cash    + Number(r.cash_collected ?? 0),
    }),
    { calls: 0, shows: 0, closed: 0, cash: 0 }
  );

  return {
    lifetime_cash:   totals.cash,
    lifetime_calls:  totals.calls,
    lifetime_closed: totals.closed,
    close_rate:      totals.shows > 0 ? (totals.closed / totals.shows) * 100 : 0,
    days_logged:     logs?.length ?? 0,
  };
}

// ── Manager: pending requests directed at them ────────────────────────────────

export async function getPendingRequestsForManager(managerId: string): Promise<RepVerificationRequestWithRep[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rep_verification_requests")
    .select("*, profiles!rep_verification_requests_user_id_fkey(full_name, email, username)")
    .eq("requested_from", managerId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!data?.length) return [];

  const results: RepVerificationRequestWithRep[] = [];
  for (const row of data as (RepVerificationRequest & {
    profiles: { full_name: string | null; email: string | null; username: string | null } | null;
  })[]) {
    const stats = await getRepLifetimeStats(row.user_id);
    results.push({
      ...row,
      rep_name:     row.profiles?.full_name ?? "Unknown Rep",
      rep_email:    row.profiles?.email ?? "",
      rep_username: row.profiles?.username ?? null,
      ...stats,
    });
  }
  return results;
}

// ── Owner portal: all pending owner-path requests ─────────────────────────────

export async function getPendingOwnerVerificationRequests(): Promise<RepVerificationRequestWithRep[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rep_verification_requests")
    .select("*, profiles!rep_verification_requests_user_id_fkey(full_name, email, username)")
    .eq("request_type", "owner")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (!data?.length) return [];

  const results: RepVerificationRequestWithRep[] = [];
  for (const row of data as (RepVerificationRequest & {
    profiles: { full_name: string | null; email: string | null; username: string | null } | null;
  })[]) {
    const stats = await getRepLifetimeStats(row.user_id);
    results.push({
      ...row,
      rep_name:     row.profiles?.full_name ?? "Unknown Rep",
      rep_email:    row.profiles?.email ?? "",
      rep_username: row.profiles?.username ?? null,
      ...stats,
    });
  }
  return results;
}

// ── Approve a request (admin action) ─────────────────────────────────────────

export async function approveRepVerification(requestId: string, reviewerId: string): Promise<{ error?: string }> {
  const admin = createAdminClient();

  // Fetch request
  const { data: req } = await admin
    .from("rep_verification_requests")
    .select("user_id, request_type, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!req || req.status !== "pending") return { error: "Request not found or already reviewed." };

  const now = new Date().toISOString();

  // Update request
  await admin
    .from("rep_verification_requests")
    .update({ status: "approved", reviewed_by: reviewerId, reviewed_at: now })
    .eq("id", requestId);

  // Update rep profile
  await admin
    .from("profiles")
    .update({
      is_verified:          true,
      verified_at:          now,
      verified_by:          reviewerId,
      verification_active:  true,
    })
    .eq("id", req.user_id);

  return {};
}

// ── Decline a request ─────────────────────────────────────────────────────────

export async function declineRepVerification(requestId: string, reviewerId: string): Promise<{ error?: string }> {
  const admin = createAdminClient();

  const { data: req } = await admin
    .from("rep_verification_requests")
    .select("user_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!req || req.status !== "pending") return { error: "Request not found or already reviewed." };

  await admin
    .from("rep_verification_requests")
    .update({ status: "declined", reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", requestId);

  return {};
}
