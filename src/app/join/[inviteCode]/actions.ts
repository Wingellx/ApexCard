"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function joinTeam(
  inviteCode: string,
  _prev: { error?: string } | null
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const admin = createAdminClient();

  const { data: team } = await admin
    .from("teams")
    .select("id, name")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (!team) return { error: "Invalid invite link." };

  const { data: existing } = await admin
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.team_id === team.id) return { error: "You're already on this team." };
    return { error: "You're already a member of another team. Leave your current team first." };
  }

  const { error } = await admin
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id });

  if (error) return { error: error.message };

  redirect("/dashboard/team");
}
