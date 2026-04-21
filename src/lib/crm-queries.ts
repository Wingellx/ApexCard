import { createAdminClient } from "@/lib/supabase/admin";

const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateShortCode(): string {
  const r = () => CHARS[Math.floor(Math.random() * CHARS.length)];
  return `${r()}${r()}${r()}-${r()}${r()}${r()}${r()}`;
}

export async function createInviteToken(teamId: string, createdBy: string) {
  const admin = createAdminClient();
  const token = generateShortCode();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("crm_invite_tokens")
    .insert({ token, team_id: teamId, created_by: createdBy, expires_at: expiresAt })
    .select("token, expires_at")
    .single();

  if (error) throw error;
  return data as { token: string; expires_at: string };
}

export async function getInviteTokenInfo(token: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_invite_tokens")
    .select(`
      id, token, team_id, expires_at, used_at,
      teams:team_id ( name ),
      creator:created_by ( full_name )
    `)
    .eq("token", token)
    .maybeSingle();

  return data as {
    id: string;
    token: string;
    team_id: string;
    expires_at: string;
    used_at: string | null;
    teams: { name: string } | null;
    creator: { full_name: string } | null;
  } | null;
}

export async function redeemInviteToken(token: string, userId: string) {
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("crm_invite_tokens")
    .select("id, team_id, expires_at, used_at, created_by")
    .eq("token", token)
    .maybeSingle();

  if (!invite)             throw new Error("Invalid invite token.");
  if (invite.used_at)      throw new Error("This invite has already been used.");
  if (new Date(invite.expires_at) < new Date()) throw new Error("This invite has expired.");

  const { data: existing } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.team_id === invite.team_id) throw new Error("You are already on this team.");
  if (existing) throw new Error("You are already a member of another team. Leave your current team first.");

  const { error: insertError } = await admin
    .from("team_members")
    .insert({
      team_id:    invite.team_id,
      user_id:    userId,
      role:       "member",
      invited_by: invite.created_by,
    });

  if (insertError) throw new Error(insertError.message);

  await admin
    .from("crm_invite_tokens")
    .update({ used_at: new Date().toISOString(), used_by: userId })
    .eq("id", invite.id);

  return { teamId: invite.team_id };
}

export async function getManagerInviteTokens(managerId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_invite_tokens")
    .select("id, token, expires_at, used_at, created_at")
    .eq("created_by", managerId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (data ?? []) as {
    id: string;
    token: string;
    expires_at: string;
    used_at: string | null;
    created_at: string;
  }[];
}

export async function getCRMSubmissions(
  teamId: string,
  opts: { memberId?: string; from?: string; to?: string } = {}
) {
  const admin = createAdminClient();
  let query = admin
    .from("crm_submissions")
    .select("*, profiles:user_id ( full_name, email )")
    .eq("team_id", teamId)
    .order("submission_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts.from)     query = query.gte("submission_date", opts.from);
  if (opts.to)       query = query.lte("submission_date", opts.to);
  if (opts.memberId) query = query.eq("user_id", opts.memberId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getMySubmissions(userId: string, limit = 50) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_submissions")
    .select("*")
    .eq("user_id", userId)
    .order("submission_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getCRMTeamMembers(teamId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_members")
    .select("user_id, profiles:user_id ( full_name, email )")
    .eq("team_id", teamId)
    .eq("role", "member");

  return (data ?? []) as unknown as {
    user_id: string;
    profiles: { full_name: string; email: string } | null;
  }[];
}

// ── Daily log queries ─────────────────────────────────────────────

export type DailyLog = {
  id: string;
  user_id: string;
  team_id: string;
  log_date: string;
  outbound_messages: number;
  followup_messages: number;
  calls_pitched: number;
  calls_booked: number;
  replied: number;
  disqualified: number;
  hours_worked: number;
  score: number;
  updated_at: string;
};

export async function getMyDailyLogs(userId: string, limit = 30): Promise<DailyLog[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_daily_logs")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DailyLog[];
}

export async function getTodayLog(userId: string): Promise<DailyLog | null> {
  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await admin
    .from("crm_daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", today)
    .maybeSingle();
  return (data ?? null) as DailyLog | null;
}

export type MemberStats = {
  user_id: string;
  full_name: string;
  email: string;
  total_score: number;
  total_outbound: number;
  total_followup: number;
  total_pitched: number;
  total_booked: number;
  total_replied: number;
  total_disqualified: number;
  total_hours: number;
  days_logged: number;
  booking_rate: number;
};

export async function getTeamLeaderboard(
  teamId: string,
  opts: { from?: string; to?: string } = {}
): Promise<MemberStats[]> {
  const admin = createAdminClient();

  let query = admin
    .from("crm_daily_logs")
    .select("user_id, score, outbound_messages, followup_messages, calls_pitched, calls_booked, replied, disqualified, hours_worked, profiles:user_id ( full_name, email )")
    .eq("team_id", teamId);

  if (opts.from) query = query.gte("log_date", opts.from);
  if (opts.to)   query = query.lte("log_date", opts.to);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as (DailyLog & { profiles: { full_name: string; email: string } | null })[];

  // Aggregate per user
  const map = new Map<string, MemberStats>();
  for (const row of rows) {
    const existing = map.get(row.user_id);
    if (existing) {
      existing.total_score        += Number(row.score);
      existing.total_outbound     += row.outbound_messages;
      existing.total_followup     += row.followup_messages;
      existing.total_pitched      += row.calls_pitched;
      existing.total_booked       += row.calls_booked;
      existing.total_replied      += row.replied;
      existing.total_disqualified += row.disqualified;
      existing.total_hours        += Number(row.hours_worked);
      existing.days_logged        += 1;
    } else {
      map.set(row.user_id, {
        user_id:           row.user_id,
        full_name:         row.profiles?.full_name ?? row.profiles?.email ?? "Unknown",
        email:             row.profiles?.email ?? "",
        total_score:       Number(row.score),
        total_outbound:    row.outbound_messages,
        total_followup:    row.followup_messages,
        total_pitched:     row.calls_pitched,
        total_booked:      row.calls_booked,
        total_replied:     row.replied,
        total_disqualified: row.disqualified,
        total_hours:       Number(row.hours_worked),
        days_logged:       1,
        booking_rate:      0,
      });
    }
  }

  const results = Array.from(map.values()).map(m => ({
    ...m,
    booking_rate: m.total_pitched > 0 ? Math.round((m.total_booked / m.total_pitched) * 100) : 0,
  }));

  return results.sort((a, b) => b.total_score - a.total_score);
}

export async function getTeamDailyLogs(
  teamId: string,
  opts: { from?: string; to?: string; memberId?: string } = {}
): Promise<(DailyLog & { profiles: { full_name: string; email: string } | null })[]> {
  const admin = createAdminClient();
  let query = admin
    .from("crm_daily_logs")
    .select("*, profiles:user_id ( full_name, email )")
    .eq("team_id", teamId)
    .order("log_date", { ascending: false });

  if (opts.from)     query = query.gte("log_date", opts.from);
  if (opts.to)       query = query.lte("log_date", opts.to);
  if (opts.memberId) query = query.eq("user_id", opts.memberId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as (DailyLog & { profiles: { full_name: string; email: string } | null })[];
}

export async function getUserRankInTeam(userId: string, teamId: string): Promise<{ rank: number; total: number }> {
  const admin = createAdminClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  const from = monthStart.toISOString().split("T")[0];

  const leaderboard = await getTeamLeaderboard(teamId, { from });
  const idx = leaderboard.findIndex(m => m.user_id === userId);
  return { rank: idx === -1 ? leaderboard.length + 1 : idx + 1, total: leaderboard.length };
}
