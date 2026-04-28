"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitCallLog(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean } | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to log calls." };
  }

  const date = formData.get("date") as string;
  const calls_taken = parseInt(formData.get("calls_taken") as string, 10) || 0;
  const shows = parseInt(formData.get("shows") as string, 10) || 0;
  const offers_made = parseInt(formData.get("offers_made") as string, 10) || 0;
  const offers_taken = parseInt(formData.get("offers_taken") as string, 10) || 0;
  const cash_collected = parseFloat(formData.get("cash_collected") as string) || 0;
  const commission_earned = parseFloat(formData.get("commission_earned") as string) || 0;
  const notes = (formData.get("notes") as string).trim() || null;

  if (!date) return { error: "Date is required." };
  if (shows > calls_taken) return { error: "Shows cannot exceed calls taken." };
  if (offers_taken > offers_made) return { error: "Closed deals cannot exceed offers made." };

  const { error } = await supabase
    .from("call_logs")
    .upsert(
      {
        user_id: user.id,
        date,
        calls_taken,
        shows,
        offers_made,
        offers_taken,
        cash_collected,
        commission_earned,
        notes,
      },
      { onConflict: "user_id,date" }
    );

  if (error) return { error: error.message };

  // Update last_log_date and re-activate verification if they're verified
  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const { data: profileData } = await admin
    .from("profiles")
    .select("is_verified")
    .eq("id", user.id)
    .maybeSingle();
  const updatePayload: Record<string, unknown> = { last_log_date: today };
  if (profileData?.is_verified) updatePayload.verification_active = true;
  await admin.from("profiles").update(updatePayload).eq("id", user.id);

  revalidatePath("/dashboard");
  return { success: true };
}
