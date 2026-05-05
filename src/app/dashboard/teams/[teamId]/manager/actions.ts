"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/resend";
import { buildEchelonOnOfferEmail } from "@/lib/email";
import { logPhaseHistory } from "@/lib/echelon-queries";
import { recalculateTeamScores } from "@/lib/scoring/echelonScore";

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

// Move member from learning → outreach
export async function moveToOutreach(userId: string, teamId: string): Promise<{ error?: string }> {
  try {
    const managerId = await assertManagerAccess(teamId);
    const admin = createAdminClient();

    const { data: member } = await admin
      .from("team_members")
      .select("phase, course_complete")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .maybeSingle();

    if (!member) return { error: "Member not found" };
    if (member.phase !== "learning") return { error: "Member is not in learning phase" };

    // Check eligibility: course complete AND ≥4 group calls
    const { count: callCount } = await admin
      .from("group_call_attendance")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("team_id", teamId);

    if (!member.course_complete) return { error: "Course not marked complete" };
    if ((callCount ?? 0) < 4) return { error: `Need 4 group calls (currently ${callCount ?? 0})` };

    await admin
      .from("team_members")
      .update({ phase: "outreach", phase_updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("team_id", teamId);

    await logPhaseHistory({ userId, teamId, fromPhase: "learning", toPhase: "outreach", changedBy: managerId });

    revalidatePath(`/dashboard/teams/${teamId}/manager`);
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Approve offer request (outreach → on_offer)
export async function approveOfferRequest(userId: string, teamId: string): Promise<{ error?: string }> {
  try {
    const managerId = await assertManagerAccess(teamId);
    const admin = createAdminClient();

    await admin
      .from("team_members")
      .update({ phase: "on_offer", offer_request_status: "approved", phase_updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("team_id", teamId);

    await logPhaseHistory({ userId, teamId, fromPhase: "outreach", toPhase: "on_offer", changedBy: managerId });

    // Send confirmation email
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.email) {
      const email = buildEchelonOnOfferEmail({ name: profile.full_name ?? "there" });
      await sendEmail({ to: profile.email, subject: email.subject, html: email.html });
    }

    revalidatePath(`/dashboard/teams/${teamId}/manager`);
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Reject offer request (reset to none so they can re-request)
export async function rejectOfferRequest(userId: string, teamId: string): Promise<{ error?: string }> {
  try {
    await assertManagerAccess(teamId);
    const admin = createAdminClient();

    await admin
      .from("team_members")
      .update({ offer_request_status: "none" })
      .eq("user_id", userId)
      .eq("team_id", teamId);

    revalidatePath(`/dashboard/teams/${teamId}/manager`);
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Toggle course complete
export async function setCourseComplete(userId: string, teamId: string, complete: boolean): Promise<{ error?: string }> {
  try {
    await assertManagerAccess(teamId);
    const admin = createAdminClient();

    const { error } = await admin
      .from("team_members")
      .update({ course_complete: complete })
      .eq("user_id", userId)
      .eq("team_id", teamId);

    if (error) return { error: error.message };

    // Recalculate score after course status change
    await recalculateTeamScores(teamId);

    revalidatePath(`/dashboard/teams/${teamId}/manager`);
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// Save manager note
export async function saveManagerNote(userId: string, teamId: string, note: string): Promise<{ error?: string }> {
  try {
    const managerId = await assertManagerAccess(teamId);
    const admin = createAdminClient();

    const { error } = await admin
      .from("manager_notes")
      .upsert(
        { user_id: userId, team_id: teamId, manager_id: managerId, note: note.trim(), updated_at: new Date().toISOString() },
        { onConflict: "user_id,team_id,manager_id" }
      );

    if (error) return { error: error.message };

    revalidatePath(`/dashboard/teams/${teamId}/manager`);
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
