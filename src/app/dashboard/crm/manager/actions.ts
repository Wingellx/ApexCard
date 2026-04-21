"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserTeam, getUserTeamRole } from "@/lib/queries";
import { upsertTeamKpi } from "@/lib/crm-queries";

export async function saveKPIs(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const [role, userTeam] = await Promise.all([
    getUserTeamRole(user.id),
    getUserTeam(user.id),
  ]);
  if (role !== "admin" || !userTeam) return { error: "Only managers can set KPIs." };

  function int(key: string) {
    const v = parseInt(formData.get(key) as string ?? "0", 10);
    return isNaN(v) || v < 0 ? 0 : v;
  }
  function dec(key: string) {
    const v = parseFloat(formData.get(key) as string ?? "0");
    return isNaN(v) || v < 0 ? 0 : v;
  }

  try {
    await upsertTeamKpi(userTeam.teamId, user.id, {
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
  return { success: true };
}
