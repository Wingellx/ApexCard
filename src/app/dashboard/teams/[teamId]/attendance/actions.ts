"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertManagerAccess(teamId: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!membership || !["admin", "offer_owner"].includes(membership.role as string)) {
    throw new Error("Forbidden");
  }
  return user.id;
}

export async function markAttendance(formData: FormData): Promise<{ error?: string }> {
  const teamId     = formData.get("teamId")     as string;
  const userId     = formData.get("userId")     as string;
  const sessionDate = formData.get("sessionDate") as string;
  const sessionDay  = formData.get("sessionDay")  as string;
  const checked    = formData.get("checked") === "true";

  try {
    await assertManagerAccess(teamId);
  } catch {
    return { error: "Forbidden" };
  }

  const admin = createAdminClient();

  if (checked) {
    const { error } = await admin
      .from("group_call_attendance")
      .upsert(
        { user_id: userId, team_id: teamId, session_date: sessionDate, session_day: sessionDay },
        { onConflict: "user_id,team_id,session_date" }
      );
    if (error) return { error: error.message };
  } else {
    const { error } = await admin
      .from("group_call_attendance")
      .delete()
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .eq("session_date", sessionDate);
    if (error) return { error: error.message };
  }

  revalidatePath(`/dashboard/teams/${teamId}/attendance`);
  return {};
}
