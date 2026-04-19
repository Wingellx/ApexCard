"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { IO_TEAM_ID } from "@/lib/io-score";

export async function joinTeam(
  inviteCode: string,
  _prev: { error?: string } | null
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("[joinTeam] auth error:", authError.message);
    return { error: "Authentication error. Please sign in again." };
  }
  if (!user) return { error: "Not authenticated." };

  console.log("[joinTeam] user:", user.id, "| inviteCode:", JSON.stringify(inviteCode));

  const admin = createAdminClient();

  // Fetch all teams and JS-match — PostgREST .eq() on this table is unreliable
  const { data: allTeams, error: teamsError } = await admin
    .from("teams")
    .select("id, name, invite_code");

  if (teamsError) {
    console.error("[joinTeam] teams fetch error:", teamsError.message, teamsError.details);
    return { error: "Could not look up team. Please try again." };
  }

  console.log("[joinTeam] looking for:", JSON.stringify(inviteCode), "| all codes:", allTeams?.map(t => t.invite_code));

  const matchedTeam = (allTeams ?? []).find(
    t => t.invite_code.trim() === inviteCode.trim()
  );

  if (!matchedTeam) {
    console.error("[joinTeam] no team matched invite code:", JSON.stringify(inviteCode));
    return { error: "Invalid invite link." };
  }

  console.log("[joinTeam] matched team:", matchedTeam.id, matchedTeam.name);

  // Verify user has a profile (FK required by team_members)
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[joinTeam] profile fetch error:", profileError.message);
    return { error: "Could not load your profile. Please try again." };
  }
  if (!profile) {
    console.error("[joinTeam] no profile row for user:", user.id);
    return { error: "Your profile hasn't been set up yet. Please complete sign-up first." };
  }

  console.log("[joinTeam] profile ok, onboarding_completed:", profile.onboarding_completed);

  // Check for existing membership
  const { data: existing, error: memberCheckError } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberCheckError) {
    console.error("[joinTeam] membership check error:", memberCheckError.message);
    return { error: "Could not check membership status. Please try again." };
  }
  if (existing) {
    if (existing.team_id === matchedTeam.id) return { error: "You're already on this team." };
    return { error: "You're already a member of another team. Leave your current team first." };
  }

  // First member to join a team becomes the admin
  const { data: existingTeamMembers } = await admin
    .from("team_members")
    .select("team_id");
  const isFirstMember = (existingTeamMembers ?? []).filter(r => r.team_id === matchedTeam.id).length === 0;

  // Insert the membership row
  const { error: insertError } = await admin
    .from("team_members")
    .insert({ team_id: matchedTeam.id, user_id: user.id, role: isFirstMember ? "admin" : "member" });

  if (insertError) {
    console.error("[joinTeam] insert error:", insertError.code, insertError.message, insertError.details);
    return { error: insertError.message };
  }

  console.log("[joinTeam] joined successfully:", matchedTeam.id);

  // Users who haven't finished onboarding must do so before accessing the dashboard
  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  redirect(matchedTeam.id === IO_TEAM_ID ? "/dashboard/io" : "/dashboard/team");
}
