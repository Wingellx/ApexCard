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
        hours_worked:      decimal("hours_worked"),
        updated_at:        new Date().toISOString(),
      },
      { onConflict: "user_id,log_date" }
    );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/crm");
  return { success: true };
}

export async function logClosedCall(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const userTeam = await getUserTeam(user.id);
  if (!userTeam) return { error: "You must be part of a team to log calls." };

  const lead_name = (formData.get("lead_name") as string)?.trim();
  if (!lead_name) return { error: "Lead name is required." };

  const closed_amount  = parseFloat(formData.get("closed_amount")  as string ?? "0");
  const commission_pct = parseFloat(formData.get("commission_pct") as string ?? "0");
  const closer_name    = (formData.get("closer_name") as string)?.trim() || null;
  const date_closed    = (formData.get("date_closed") as string) || new Date().toISOString().split("T")[0];

  const admin = createAdminClient();
  const { error } = await admin
    .from("setter_closed_calls")
    .insert({
      user_id:        user.id,
      team_id:        userTeam.teamId,
      lead_name,
      closed_amount:  isNaN(closed_amount)  || closed_amount  < 0   ? 0   : closed_amount,
      commission_pct: isNaN(commission_pct) || commission_pct < 0   ? 0   : Math.min(100, commission_pct),
      closer_name,
      date_closed,
    });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/crm");
  return { success: true };
}

export async function saveSetterPreferences(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const pct = parseFloat(formData.get("default_commission_pct") as string ?? "10");
  if (isNaN(pct) || pct < 0 || pct > 100) return;

  const admin = createAdminClient();
  await admin
    .from("setter_preferences")
    .upsert(
      { user_id: user.id, default_commission_pct: pct, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  revalidatePath("/dashboard/crm");
}
