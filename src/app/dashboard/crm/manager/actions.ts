"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTeam, getUserTeamRole } from "@/lib/queries";
import { upsertTeamKpi } from "@/lib/crm-queries";

export async function removeMember(
  teamId: string,
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const role = await getUserTeamRole(user.id);
  if (role !== "admin") return { error: "Only managers can remove members." };

  const admin = createAdminClient();

  // Verify caller manages this team
  const [memberRes, managerRes] = await Promise.all([
    admin.from("team_members").select("team_id").eq("user_id", user.id).eq("team_id", teamId).eq("role", "admin").maybeSingle(),
    admin.from("team_managers").select("team_id").eq("user_id", user.id).eq("team_id", teamId).maybeSingle(),
  ]);
  if (!memberRes.data && !managerRes.data) return { error: "You do not manage this team." };

  // Prevent self-removal
  if (memberId === user.id) return { error: "You cannot remove yourself." };

  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", memberId);

  if (error) return { error: "Failed to remove member." };

  revalidatePath(`/dashboard/crm/manager/${teamId}`);
  revalidatePath("/dashboard/crm/manager");
  return {};
}

export async function saveKPIs(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const role = await getUserTeamRole(user.id);
  if (role !== "admin") return { error: "Only managers can set KPIs." };

  const formTeamId = formData.get("team_id") as string | null;

  let teamId: string;
  if (formTeamId) {
    // Verify the user actually manages this team
    const admin = createAdminClient();
    const [memberRes, managerRes] = await Promise.all([
      admin.from("team_members").select("team_id").eq("user_id", user.id).eq("team_id", formTeamId).eq("role", "admin").maybeSingle(),
      admin.from("team_managers").select("team_id").eq("user_id", user.id).eq("team_id", formTeamId).maybeSingle(),
    ]);
    if (!memberRes.data && !managerRes.data) return { error: "You do not manage this team." };
    teamId = formTeamId;
  } else {
    const userTeam = await getUserTeam(user.id);
    if (!userTeam) return { error: "Could not find your team." };
    teamId = userTeam.teamId;
  }

  function int(key: string) {
    const v = parseInt(formData.get(key) as string ?? "0", 10);
    return isNaN(v) || v < 0 ? 0 : v;
  }
  function dec(key: string) {
    const v = parseFloat(formData.get(key) as string ?? "0");
    return isNaN(v) || v < 0 ? 0 : v;
  }

  try {
    await upsertTeamKpi(teamId, user.id, {
      outbound_target: int("outbound_target"),
      followup_target: int("followup_target"),
      pitched_target:  int("pitched_target"),
      booked_target:   int("booked_target"),
      replied_target:  int("replied_target"),
      hours_target:    dec("hours_target"),
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save KPIs." };
  }

  revalidatePath("/dashboard/crm/manager");
  revalidatePath(`/dashboard/crm/manager/${teamId}`);
  return { success: true };
}
