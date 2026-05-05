"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { IO_TEAM_ID } from "@/lib/io-score";
import type { InviteRole, TokenType } from "@/lib/invite-queries";

export async function joinTeam(
  inviteCode:   string,
  assignedRole: InviteRole,
  tokenType:    TokenType,
  _prev: { error?: string } | null
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) return { error: "Authentication error. Please sign in again." };
  if (!user)     return { error: "Not authenticated." };

  const admin = createAdminClient();

  // Fetch all teams and JS-match — PostgREST .eq() on this table is unreliable
  const { data: allTeams, error: teamsError } = await admin
    .from("teams")
    .select("id, name, invite_code, invite_token_owner, invite_token_manager, invite_token_member");

  if (teamsError) return { error: "Could not look up team. Please try again." };

  const tok = inviteCode.trim();
  const matchedTeam = (allTeams ?? []).find(t => {
    const row = t as Record<string, unknown>;
    return (
      (row.invite_token_owner   as string | null)?.trim() === tok ||
      (row.invite_token_manager as string | null)?.trim() === tok ||
      (row.invite_token_member  as string | null)?.trim() === tok ||
      (t.invite_code             as string | null)?.trim() === tok
    );
  });

  if (!matchedTeam) return { error: "Invalid invite link." };

  // Verify user has a profile (FK required by team_members)
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) return { error: "Could not load your profile. Please try again." };
  if (!profile)     return { error: "Your profile hasn't been set up yet. Please complete sign-up first." };

  // Check for existing membership
  const { data: existing, error: memberCheckError } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberCheckError) return { error: "Could not check membership status. Please try again." };
  if (existing) {
    if (existing.team_id === matchedTeam.id) return { error: "You're already on this team." };
    return { error: "You're already a member of another team. Leave your current team first." };
  }

  // For typed tokens, always use the specified role.
  // For legacy invite_code, first member becomes admin for backward compat.
  let role: string = assignedRole;
  if (tokenType === "legacy_code") {
    const { data: existingTeamMembers } = await admin
      .from("team_members")
      .select("user_id")
      .eq("team_id", matchedTeam.id);
    if (!existingTeamMembers?.length) role = "admin";
  }

  const { error: insertError } = await admin
    .from("team_members")
    .insert({ team_id: matchedTeam.id, user_id: user.id, role });

  if (insertError) return { error: insertError.message };

  if (!profile.onboarding_completed) redirect("/onboarding");

  redirect(matchedTeam.id === IO_TEAM_ID ? "/dashboard/io" : "/dashboard");
}
