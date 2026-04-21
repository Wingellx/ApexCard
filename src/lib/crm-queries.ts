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
