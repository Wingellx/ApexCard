"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveBodyMetrics(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const logDate  = formData.get("log_date") as string;
  if (!logDate)  return { error: "Date is required." };

  const weight   = formData.get("weight_lbs") as string;
  const pr1Name  = (formData.get("pr1_name")  as string)?.trim() || null;
  const pr1Val   = formData.get("pr1_value")  as string;
  const pr2Name  = (formData.get("pr2_name")  as string)?.trim() || null;
  const pr2Val   = formData.get("pr2_value")  as string;
  const pr3Name  = (formData.get("pr3_name")  as string)?.trim() || null;
  const pr3Val   = formData.get("pr3_value")  as string;

  const { error } = await supabase
    .from("body_metrics")
    .upsert({
      user_id:   user.id,
      log_date:  logDate,
      weight_lbs: weight   ? parseFloat(weight)  : null,
      pr1_name:   pr1Name,
      pr1_value:  pr1Val && pr1Name ? parseFloat(pr1Val) : null,
      pr2_name:   pr2Name,
      pr2_value:  pr2Val && pr2Name ? parseFloat(pr2Val) : null,
      pr3_name:   pr3Name,
      pr3_value:  pr3Val && pr3Name ? parseFloat(pr3Val) : null,
    }, { onConflict: "user_id,log_date" });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/io/body");
  return {};
}
