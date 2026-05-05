"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InviteRole, TokenType } from "@/lib/invite-queries";

export async function signupForTeam(
  inviteCode:   string,
  assignedRole: InviteRole,
  tokenType:    TokenType,
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const full_name = (formData.get("full_name") as string ?? "").trim();
  const email     = (formData.get("email")     as string ?? "").trim().toLowerCase();
  const password  = (formData.get("password")  as string ?? "");

  if (!full_name) return { error: "Name is required." };
  if (!email)     return { error: "Email is required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const admin = createAdminClient();

  // Validate invite code and find the team
  const { data: allTeams } = await admin
    .from("teams")
    .select("id, name, invite_code, invite_token_owner, invite_token_manager, invite_token_member");

  const tok = inviteCode.trim();
  const team = (allTeams ?? []).find(t => {
    const row = t as Record<string, unknown>;
    return (
      (row.invite_token_owner   as string | null)?.trim() === tok ||
      (row.invite_token_manager as string | null)?.trim() === tok ||
      (row.invite_token_member  as string | null)?.trim() === tok ||
      (t.invite_code             as string | null)?.trim() === tok
    );
  });
  if (!team) return { error: "Invalid or expired invite link." };

  // Create the auth user
  const supabase = await createClient();
  const { data, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });

  if (signupError) return { error: signupError.message };

  // Email confirmation required — we can't complete setup yet
  if (!data.session) redirect(`/auth/check-email`);

  const userId = data.user!.id;

  // Update profile
  await admin.from("profiles").update({
    full_name,
    account_type:         "team_member",
    onboarding_completed: true,
  }).eq("id", userId);

  // Determine role: typed tokens always win; legacy_code gives first-member admin
  let role: string = assignedRole;
  if (tokenType === "legacy_code") {
    const { data: existingMembers } = await admin
      .from("team_members")
      .select("user_id")
      .eq("team_id", team.id as string);
    if (!existingMembers?.length) role = "admin";
  }

  await admin.from("team_members").insert({
    team_id: team.id as string,
    user_id: userId,
    role,
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
