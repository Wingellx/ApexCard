"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTeamRole } from "@/lib/queries";

async function requireAdmin(): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };
  const role = await getUserTeamRole(user.id);
  if (role !== "admin") return { error: "Not authorized." };
  return { userId: user.id };
}

export async function setMemberTrainingSplit(
  targetUserId: string,
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const rows = [];
  for (let day = 1; day <= 7; day++) {
    const name = ((formData.get(`day_${day}`) as string) ?? "").trim() || "Rest";
    rows.push({
      user_id:      targetUserId,
      day_of_week:  day,
      session_name: name,
      assigned_by:  auth.userId,
      updated_at:   new Date().toISOString(),
    });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("training_splits")
    .upsert(rows, { onConflict: "user_id,day_of_week" });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/team/admin");
  return {};
}

export async function removeMember(
  targetUserId: string,
  _prev: { error?: string } | null
): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };
  if (targetUserId === auth.userId) return { error: "You can't remove yourself." };

  const adminDb = createAdminClient();
  const { data: allMembers } = await adminDb.from("team_members").select("user_id, team_id");
  const myRow     = (allMembers ?? []).find((r: { user_id: string }) => r.user_id === auth.userId);
  const targetRow = (allMembers ?? []).find((r: { user_id: string }) => r.user_id === targetUserId);
  if (!myRow || !targetRow)               return { error: "Member not found." };
  if (myRow.team_id !== targetRow.team_id) return { error: "Not on your team." };

  const { error } = await adminDb
    .from("team_members")
    .delete()
    .eq("user_id", targetUserId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/team/admin");
  return {};
}
