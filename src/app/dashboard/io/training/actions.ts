"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveTrainingSplit(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const rows = [];
  for (let day = 1; day <= 7; day++) {
    const name = (formData.get(`day_${day}`) as string)?.trim();
    if (name) {
      rows.push({ user_id: user.id, day_of_week: day, session_name: name, updated_at: new Date().toISOString() });
    }
  }

  if (rows.length === 0) return { error: "Enter at least one session." };

  const { error } = await supabase
    .from("training_splits")
    .upsert(rows, { onConflict: "user_id,day_of_week" });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/io/training");
  return {};
}
