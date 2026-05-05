"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type InviteRole = "offer_owner" | "sales_manager" | "member";
export type TokenType  = "owner_token" | "manager_token" | "member_token" | "legacy_code";

export type TeamTokenResult = {
  id:           string;
  name:         string;
  description:  string | null;
  logo_url:     string | null;
  memberCount:  number;
  assignedRole: InviteRole;
  tokenType:    TokenType;
};

export type TeamInviteTokens = {
  ownerToken:   string | null;
  managerToken: string | null;
  memberToken:  string | null;
};

export async function getTeamByToken(token: string): Promise<TeamTokenResult | null> {
  const admin = createAdminClient();
  const { data: teams, error } = await admin
    .from("teams")
    .select("id, name, description, logo_url, invite_code, invite_token_owner, invite_token_manager, invite_token_member");

  if (error || !teams) return null;

  const tok = token.trim();

  let matched: (typeof teams)[0] | null = null;
  let assignedRole: InviteRole = "member";
  let tokenType: TokenType    = "legacy_code";

  for (const t of teams) {
    if ((t as Record<string, unknown>).invite_token_owner && ((t as Record<string, unknown>).invite_token_owner as string).trim() === tok) {
      matched = t; assignedRole = "offer_owner";   tokenType = "owner_token";   break;
    }
    if ((t as Record<string, unknown>).invite_token_manager && ((t as Record<string, unknown>).invite_token_manager as string).trim() === tok) {
      matched = t; assignedRole = "sales_manager"; tokenType = "manager_token"; break;
    }
    if ((t as Record<string, unknown>).invite_token_member && ((t as Record<string, unknown>).invite_token_member as string).trim() === tok) {
      matched = t; assignedRole = "member";        tokenType = "member_token";  break;
    }
    if ((t.invite_code as string | null)?.trim() === tok) {
      matched = t; assignedRole = "member";        tokenType = "legacy_code";   break;
    }
  }

  if (!matched) return null;

  const { data: allMembers } = await admin.from("team_members").select("team_id");
  const memberCount = (allMembers ?? []).filter(r => r.team_id === matched!.id).length;

  return {
    id:           matched.id          as string,
    name:         matched.name        as string,
    description:  matched.description as string | null,
    logo_url:     matched.logo_url    as string | null,
    memberCount,
    assignedRole,
    tokenType,
  };
}

export async function getTeamInviteTokens(teamId: string): Promise<TeamInviteTokens> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("teams")
    .select("invite_token_owner, invite_token_manager, invite_token_member")
    .eq("id", teamId)
    .maybeSingle();

  const row = data as Record<string, unknown> | null;
  return {
    ownerToken:   (row?.invite_token_owner   as string | null) ?? null,
    managerToken: (row?.invite_token_manager as string | null) ?? null,
    memberToken:  (row?.invite_token_member  as string | null) ?? null,
  };
}
