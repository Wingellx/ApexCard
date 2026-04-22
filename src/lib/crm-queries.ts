import { createAdminClient } from "@/lib/supabase/admin";

// ── KPI types & scoring ───────────────────────────────────────────

export type CRMKpi = {
  id: string;
  team_id: string;
  outbound_target: number;
  followup_target: number;
  pitched_target: number;
  booked_target: number;
  replied_target: number;
  hours_target: number;
  updated_at: string;
};

// Base points per unit for each metric
const BASE_WEIGHTS = {
  calls_booked:      10.0,
  calls_pitched:      3.0,
  replied:            2.0,
  followup_messages:  1.5,
  hours_worked:       2.0,
  outbound_messages:  1.0,
} as const;

// multiplier: 1.0x at/below target, scales to 2.0x at 3× target
function achievementMultiplier(actual: number, target: number): number {
  if (target <= 0 || actual < target) return 1.0;
  return Math.min(2.0, 1.0 + 0.5 * (actual / target - 1.0));
}

export function computeScore(log: DailyLog, kpi: CRMKpi | null): number {
  const metrics: { logKey: keyof typeof BASE_WEIGHTS; kpiKey: keyof CRMKpi }[] = [
    { logKey: "calls_booked",      kpiKey: "booked_target"   },
    { logKey: "calls_pitched",     kpiKey: "pitched_target"  },
    { logKey: "replied",           kpiKey: "replied_target"  },
    { logKey: "followup_messages", kpiKey: "followup_target" },
    { logKey: "hours_worked",      kpiKey: "hours_target"    },
    { logKey: "outbound_messages", kpiKey: "outbound_target" },
  ];

  let score = 0;
  for (const { logKey, kpiKey } of metrics) {
    const actual = Number(log[logKey] ?? 0);
    const target = kpi ? Number(kpi[kpiKey] ?? 0) : 0;
    score += actual * BASE_WEIGHTS[logKey] * achievementMultiplier(actual, target);
  }
  return Math.round(score * 10) / 10;
}

// KPI achievement per metric (for display)
export type KpiStatus = { met: boolean; ratio: number; multiplier: number };

export function getKpiStatus(log: DailyLog, kpi: CRMKpi): Record<string, KpiStatus> {
  const pairs: [keyof DailyLog, keyof CRMKpi][] = [
    ["outbound_messages", "outbound_target"],
    ["followup_messages", "followup_target"],
    ["calls_pitched",     "pitched_target" ],
    ["calls_booked",      "booked_target"  ],
    ["replied",           "replied_target" ],
    ["hours_worked",      "hours_target"   ],
  ];
  const out: Record<string, KpiStatus> = {};
  for (const [logKey, kpiKey] of pairs) {
    const actual = Number(log[logKey] ?? 0);
    const target = Number(kpi[kpiKey] ?? 0);
    out[logKey] = {
      met:        target > 0 ? actual >= target : false,
      ratio:      target > 0 ? actual / target : 1,
      multiplier: achievementMultiplier(actual, target),
    };
  }
  return out;
}

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

export async function getManagerInviteTokens(managerId: string, teamId?: string) {
  const admin = createAdminClient();
  let query = admin
    .from("crm_invite_tokens")
    .select("id, token, team_id, expires_at, used_at, created_at")
    .eq("created_by", managerId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (teamId) query = query.eq("team_id", teamId);

  const { data } = await query;

  return (data ?? []) as {
    id: string;
    token: string;
    team_id: string;
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

// ── KPI queries ───────────────────────────────────────────────────

export async function getTeamKpi(teamId: string): Promise<CRMKpi | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_kpis")
    .select("*")
    .eq("team_id", teamId)
    .maybeSingle();
  return (data ?? null) as CRMKpi | null;
}

export async function upsertTeamKpi(
  teamId: string,
  createdBy: string,
  targets: Omit<CRMKpi, "id" | "team_id" | "updated_at" | "created_by">
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("crm_kpis")
    .upsert(
      { ...targets, team_id: teamId, created_by: createdBy, updated_at: new Date().toISOString() },
      { onConflict: "team_id" }
    );
  if (error) throw error;
}

// ── Leaderboard ───────────────────────────────────────────────────

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
  opts: { from?: string; to?: string; kpi?: CRMKpi | null } = {}
): Promise<MemberStats[]> {
  const admin = createAdminClient();

  let query = admin
    .from("crm_daily_logs")
    .select("*, profiles:user_id ( full_name, email )")
    .eq("team_id", teamId);

  if (opts.from) query = query.gte("log_date", opts.from);
  if (opts.to)   query = query.lte("log_date", opts.to);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as (DailyLog & { profiles: { full_name: string; email: string } | null })[];
  const kpi  = opts.kpi ?? null;

  const map = new Map<string, MemberStats>();
  for (const row of rows) {
    const rowScore = computeScore(row, kpi);
    const existing = map.get(row.user_id);
    if (existing) {
      existing.total_score        += rowScore;
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
        user_id:            row.user_id,
        full_name:          row.profiles?.full_name ?? row.profiles?.email ?? "Unknown",
        email:              row.profiles?.email ?? "",
        total_score:        rowScore,
        total_outbound:     row.outbound_messages,
        total_followup:     row.followup_messages,
        total_pitched:      row.calls_pitched,
        total_booked:       row.calls_booked,
        total_replied:      row.replied,
        total_disqualified: row.disqualified,
        total_hours:        Number(row.hours_worked),
        days_logged:        1,
        booking_rate:       0,
      });
    }
  }

  return Array.from(map.values())
    .map(m => ({
      ...m,
      total_score:  Math.round(m.total_score * 10) / 10,
      booking_rate: m.total_pitched > 0 ? Math.round((m.total_booked / m.total_pitched) * 100) : 0,
    }))
    .sort((a, b) => b.total_score - a.total_score);
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

export type ManagedTeam = {
  id: string;
  name: string;
  status: "pending" | "active" | "suspended";
  parent_team_id: string | null;
  member_count: number;
  is_primary: boolean;
};

export async function getManagedTeams(userId: string): Promise<ManagedTeam[]> {
  const admin = createAdminClient();

  const [primaryRes, managedRes] = await Promise.all([
    admin
      .from("team_members")
      .select("team_id, teams(id, name, status, parent_team_id)")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle(),
    admin
      .from("team_managers")
      .select("team_id, teams(id, name, status, parent_team_id)")
      .eq("user_id", userId),
  ]);

  const teamIds: string[] = [];
  const teams: { id: string; name: string; status: string; parent_team_id: string | null; is_primary: boolean }[] = [];

  if (primaryRes.data?.teams) {
    const t = primaryRes.data.teams as unknown as { id: string; name: string; status: string | null; parent_team_id: string | null };
    teams.push({ id: t.id, name: t.name, status: t.status ?? "active", parent_team_id: t.parent_team_id, is_primary: true });
    teamIds.push(t.id);
  }

  for (const row of (managedRes.data ?? [])) {
    const t = row.teams as unknown as { id: string; name: string; status: string | null; parent_team_id: string | null };
    if (!teamIds.includes(t.id)) {
      teams.push({ id: t.id, name: t.name, status: t.status ?? "active", parent_team_id: t.parent_team_id, is_primary: false });
      teamIds.push(t.id);
    }
  }

  if (teamIds.length === 0) return [];

  const { data: memberCounts } = await admin
    .from("team_members")
    .select("team_id")
    .in("team_id", teamIds);

  const counts = new Map<string, number>();
  for (const row of (memberCounts ?? [])) {
    counts.set(row.team_id, (counts.get(row.team_id) ?? 0) + 1);
  }

  return teams.map(t => ({
    id: t.id,
    name: t.name,
    status: (t.status ?? "active") as "pending" | "active" | "suspended",
    parent_team_id: t.parent_team_id,
    member_count: counts.get(t.id) ?? 0,
    is_primary: t.is_primary,
  }));
}

export async function getUserRankInTeam(
  userId: string,
  teamId: string,
  kpi: CRMKpi | null
): Promise<{ rank: number; total: number }> {
  const monthStart = new Date();
  monthStart.setDate(1);
  const from = monthStart.toISOString().split("T")[0];
  const leaderboard = await getTeamLeaderboard(teamId, { from, kpi });
  const idx = leaderboard.findIndex(m => m.user_id === userId);
  return { rank: idx === -1 ? leaderboard.length + 1 : idx + 1, total: leaderboard.length };
}
