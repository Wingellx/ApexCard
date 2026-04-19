"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertGoals(
  _prev: { error: string; success: boolean } | null,
  formData: FormData
): Promise<{ error: string; success: boolean }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in.", success: false };

  const month = formData.get("month") as string; // e.g. "2026-04"
  if (!month) return { error: "Month is required.", success: false };

  // Normalise to first of month
  const monthDate = `${month}-01`;

  const { error } = await supabase.from("goals").upsert(
    {
      user_id: user.id,
      month: monthDate,
      calls_target:        parseInt(formData.get("calls_target") as string)        || 0,
      show_rate_target:    parseFloat(formData.get("show_rate_target") as string)  || 0,
      close_rate_target:   parseFloat(formData.get("close_rate_target") as string) || 0,
      offers_target:       parseInt(formData.get("offers_target") as string)        || 0,
      cash_target:         parseFloat(formData.get("cash_target") as string)       || 0,
      commission_target:   parseFloat(formData.get("commission_target") as string) || 0,
    },
    { onConflict: "user_id,month" }
  );

  if (error) return { error: error.message, success: false };

  revalidatePath("/dashboard/goals");
  revalidatePath("/dashboard");
  return { error: "", success: true };
}
