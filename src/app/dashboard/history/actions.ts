"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateCallLog(
  id: string,
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const shows        = parseInt(formData.get("shows")        as string) || 0;
  const calls_taken  = parseInt(formData.get("calls_taken")  as string) || 0;
  const offers_made  = parseInt(formData.get("offers_made")  as string) || 0;
  const offers_taken = parseInt(formData.get("offers_taken") as string) || 0;

  if (shows > calls_taken)  return { error: "Shows cannot exceed calls taken." };
  if (offers_taken > offers_made) return { error: "Closed cannot exceed offers made." };

  const { error } = await supabase
    .from("call_logs")
    .update({
      calls_taken,
      shows,
      offers_made,
      offers_taken,
      cash_collected:    parseFloat(formData.get("cash_collected")    as string) || 0,
      commission_earned: parseFloat(formData.get("commission_earned") as string) || 0,
      notes: (formData.get("notes") as string).trim() || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard");
  return null;
}

export async function deleteCallLog(id: string): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const { error } = await supabase
    .from("call_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard");
  return null;
}
