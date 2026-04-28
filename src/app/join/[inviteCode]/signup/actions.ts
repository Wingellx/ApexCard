"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function signupForTeam(
  inviteCode: string,
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
  const { data: allTeams } = await admin.from("teams").select("id, name, invite_code");
  const team = (allTeams ?? []).find(
    t => (t.invite_code as string).trim() === inviteCode.trim()
  );
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
  if (!data.session) {
    redirect(`/auth/check-email`);
  }

  const userId = data.user!.id;

  // Update profile: team_member account type, skip full onboarding
  await admin.from("profiles").update({
    full_name,
    account_type:         "team_member",
    onboarding_completed: true,
  }).eq("id", userId);

  // Check current team members to decide role
  const { data: existingMembers } = await admin
    .from("team_members")
    .select("user_id")
    .eq("team_id", team.id as string);

  const isFirst = !existingMembers?.length;

  await admin.from("team_members").insert({
    team_id: team.id as string,
    user_id: userId,
    role:    isFirst ? "admin" : "member",
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
