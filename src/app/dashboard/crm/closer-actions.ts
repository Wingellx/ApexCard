"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTeam } from "@/lib/queries";

type SaveResult = { error?: string; success?: boolean; id?: string };

const VALID_OUTCOMES = ["closed", "no_show", "not_interested", "follow_up", "objection_lost"];

export async function saveCallRecord(
  _prev: SaveResult | null,
  formData: FormData
): Promise<SaveResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized." };

  const lead_name = (formData.get("lead_name") as string)?.trim();
  if (!lead_name) return { error: "Lead name is required." };

  const call_outcome = formData.get("call_outcome") as string;
  if (!VALID_OUTCOMES.includes(call_outcome)) return { error: "Invalid outcome." };

  const call_date     = (formData.get("call_date") as string) || new Date().toISOString().split("T")[0];
  const deal_val_raw  = formData.get("deal_value") as string;
  const deal_value    = call_outcome === "closed" && deal_val_raw ? parseFloat(deal_val_raw) || null : null;
  const recording_url = (formData.get("recording_url") as string)?.trim() || null;
  const notes         = (formData.get("notes") as string)?.trim() || null;
  const transcript    = (formData.get("transcript") as string)?.trim() || null;

  const userTeam = await getUserTeam(user.id);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("closer_call_records")
    .insert({
      user_id:      user.id,
      team_id:      userTeam?.teamId ?? null,
      lead_name,
      call_date,
      call_outcome,
      deal_value,
      recording_url,
      notes,
      transcript,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/crm");
  return { success: true, id: data.id };
}

export async function deleteCallRecord(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get("id") as string;
  if (!id) return;

  const admin = createAdminClient();
  await admin
    .from("closer_call_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/crm");
}
