"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeScore, getCheckinDateKey } from "@/lib/io-score";

export async function submitCheckin(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("tracking_preference")
    .eq("id", user.id)
    .single();

  const pref = (profile?.tracking_preference ?? "daily") as "daily" | "weekly";
  const checkinDate = getCheckinDateKey(pref);

  const workoutCompleted = formData.get("workout_completed") === "yes";
  const workUnits        = parseInt(formData.get("work_units") as string) || 0;
  const goalCompleted    = formData.get("goal_completed") === "yes";
  const focusRating      = parseInt(formData.get("focus_rating") as string) || 5;
  const accomplishment   = (formData.get("accomplishment") as string)?.trim() || null;

  if (focusRating < 1 || focusRating > 10) return { error: "Focus rating must be 1–10." };

  const { work, fitness, accountability, total } = computeScore(
    workUnits, workoutCompleted, goalCompleted, focusRating, pref
  );

  const { error } = await supabase
    .from("daily_checkins")
    .upsert({
      user_id:              user.id,
      checkin_date:         checkinDate,
      workout_completed:    workoutCompleted,
      work_units:           workUnits,
      goal_completed:       goalCompleted,
      focus_rating:         focusRating,
      accomplishment,
      score_work:           work,
      score_fitness:        fitness,
      score_accountability: accountability,
      performance_score:    total,
    }, { onConflict: "user_id,checkin_date" });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/io");
  revalidatePath("/dashboard/io/checkin");
  return { success: true };
}
