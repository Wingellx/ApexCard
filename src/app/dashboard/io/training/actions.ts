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

export async function saveTrainingDay(
  dayOfWeek: number,
  sessionName: string,
  exercises: { name: string; sets: string; reps: string; weight: string }[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Upsert session name
  const { error: splitError } = await supabase
    .from("training_splits")
    .upsert(
      { user_id: user.id, day_of_week: dayOfWeek, session_name: sessionName.trim() || "Rest", updated_at: new Date().toISOString() },
      { onConflict: "user_id,day_of_week" }
    );
  if (splitError) return { error: splitError.message };

  // Replace exercises for this day
  await supabase
    .from("training_exercises")
    .delete()
    .eq("user_id", user.id)
    .eq("day_of_week", dayOfWeek);

  const valid = exercises.filter(e => e.name.trim());
  if (valid.length > 0) {
    const { error: exError } = await supabase
      .from("training_exercises")
      .insert(valid.map((e, i) => ({
        user_id:          user.id,
        day_of_week:      dayOfWeek,
        exercise_order:   i,
        exercise_name:    e.name.trim(),
        sets:             e.sets ? parseInt(e.sets) || null : null,
        reps:             e.reps.trim() || null,
        weight:           e.weight.trim() || null,
      })));
    if (exError) return { error: exError.message };
  }

  revalidatePath("/dashboard/io/training");
  return {};
}
