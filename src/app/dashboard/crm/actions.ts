"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTeam } from "@/lib/queries";

export async function upsertDailyLog(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const userTeam = await getUserTeam(user.id);
  if (!userTeam) return { error: "You must be part of a team to submit logs." };

  function int(key: string) {
    const v = parseInt(formData.get(key) as string ?? "0", 10);
    return isNaN(v) || v < 0 ? 0 : v;
  }
  function decimal(key: string) {
    const v = parseFloat(formData.get(key) as string ?? "0");
    return isNaN(v) || v < 0 ? 0 : Math.min(v, 24);
  }

  const logDate = (formData.get("log_date") as string) || new Date().toISOString().split("T")[0];

  const admin = createAdminClient();
  const { error } = await admin
    .from("crm_daily_logs")
    .upsert(
      {
        user_id:           user.id,
        team_id:           userTeam.teamId,
        log_date:          logDate,
        outbound_messages: int("outbound_messages"),
        followup_messages: int("followup_messages"),
        calls_pitched:     int("calls_pitched"),
        calls_booked:      int("calls_booked"),
        replied:           int("replied"),
        disqualified:      int("disqualified"),
        hours_worked:      decimal("hours_worked"),
        updated_at:        new Date().toISOString(),
      },
      { onConflict: "user_id,log_date" }
    );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/crm");
  return { success: true };
}
