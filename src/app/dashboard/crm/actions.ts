"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTeam } from "@/lib/queries";

export async function upsertCRMSubmission(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const userTeam = await getUserTeam(user.id);
  if (!userTeam) return { error: "You must be part of a team to submit CRM entries." };

  const contactName = (formData.get("contact_name") as string)?.trim();
  if (!contactName) return { error: "Contact name is required." };

  const status          = (formData.get("status") as string) || "new_lead";
  const outcome         = (formData.get("outcome") as string) || "pending";
  const submissionDate  = (formData.get("submission_date") as string) || new Date().toISOString().split("T")[0];
  const dealValueRaw    = (formData.get("deal_value") as string)?.trim();
  const dealValue       = dealValueRaw ? parseFloat(dealValueRaw) : null;
  const notes           = (formData.get("notes") as string)?.trim() || null;
  const company         = (formData.get("company") as string)?.trim() || null;
  const contactEmail    = (formData.get("contact_email") as string)?.trim() || null;
  const contactPhone    = (formData.get("contact_phone") as string)?.trim() || null;
  const nextFollowup    = (formData.get("next_followup") as string) || null;

  if (dealValue !== null && (isNaN(dealValue) || dealValue < 0)) {
    return { error: "Deal value must be a positive number." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("crm_submissions")
    .upsert(
      {
        user_id:         user.id,
        team_id:         userTeam.teamId,
        contact_name:    contactName,
        submission_date: submissionDate,
        status,
        outcome,
        deal_value:      dealValue,
        notes,
        company,
        contact_email:   contactEmail,
        contact_phone:   contactPhone,
        next_followup:   nextFollowup || null,
        updated_at:      new Date().toISOString(),
      },
      { onConflict: "user_id,contact_name,submission_date" }
    );

  if (error) return { error: error.message };

  revalidatePath("/dashboard/crm");
  return { success: true };
}

export async function deleteCRMSubmission(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("crm_submissions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/crm");
  return {};
}
