"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

// Request offer (outreach → on_offer path B)
export async function requestOffer(teamId: string): Promise<{ error?: string }> {
  try {
    const user = await getAuthUser();
    const admin = createAdminClient();

    const { data: member } = await admin
      .from("team_members")
      .select("phase, offer_request_status")
      .eq("user_id", user.id)
      .eq("team_id", teamId)
      .maybeSingle();

    if (!member) return { error: "Not a team member" };
    if (member.phase !== "outreach") return { error: "Only available in outreach phase" };
    if (member.offer_request_status === "pending") return { error: "Request already pending" };

    const { error } = await admin
      .from("team_members")
      .update({ offer_request_status: "pending" })
      .eq("user_id", user.id)
      .eq("team_id", teamId);

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/teams/${teamId}/dashboard`);
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Log outreach (Learning/Outreach phase)
export async function logOutreach(formData: FormData): Promise<{ error?: string }> {
  try {
    const user = await getAuthUser();
    const admin = createAdminClient();

    const teamId = formData.get("teamId") as string;
    const count  = parseInt(formData.get("count") as string, 10);
    const today  = new Date().toISOString().split("T")[0];

    if (!teamId || isNaN(count) || count < 1) return { error: "Invalid count" };

    const { error } = await admin
      .from("outreach_logs")
      .upsert(
        { user_id: user.id, team_id: teamId, log_date: today, count },
        { onConflict: "user_id,team_id,log_date" }
      );

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/teams/${teamId}/dashboard`);
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Add application (Outreach phase)
export async function addApplication(formData: FormData): Promise<{ error?: string }> {
  try {
    const user = await getAuthUser();
    const admin = createAdminClient();

    const teamId       = formData.get("teamId")       as string;
    const companyName  = formData.get("companyName")  as string;
    const appliedDate  = formData.get("appliedDate")  as string;
    const notes        = formData.get("notes")        as string;
    const followUpDate = formData.get("followUpDate") as string;

    if (!companyName?.trim()) return { error: "Company name is required" };
    if (!appliedDate) return { error: "Applied date is required" };

    const { error } = await admin
      .from("echelon_applications")
      .insert({
        user_id:        user.id,
        team_id:        teamId,
        company_name:   companyName.trim(),
        applied_date:   appliedDate,
        notes:          notes?.trim() || null,
        follow_up_date: followUpDate || null,
        follow_up_done: false,
        status:         "applied",
      });

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/teams/${teamId}/dashboard`);
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Mark follow-up done
export async function markFollowUpDone(applicationId: string, teamId: string): Promise<{ error?: string }> {
  try {
    const user = await getAuthUser();
    const admin = createAdminClient();

    const { error } = await admin
      .from("echelon_applications")
      .update({ follow_up_done: true })
      .eq("id", applicationId)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/teams/${teamId}/dashboard`);
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
