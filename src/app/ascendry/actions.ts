"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAscendryUser } from "@/lib/ascendry-queries";

async function requireAscendryUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const ascendryUser = await getAscendryUser(user.id);
  if (!ascendryUser) throw new Error("No Ascendry access");
  return { user, ascendryUser, supabase };
}

async function requireAdmin() {
  const ctx = await requireAscendryUser();
  if (ctx.ascendryUser.role !== "admin") throw new Error("Admin only");
  return ctx;
}

// ── Prospects ───────────────────────────────────────────────

const PIPELINE_STAGES: Record<string, string> = {
  "Replied":    "Replied",
  "Positive":   "Replied",
  "Call Booked":"Call Booked",
};

async function maybeCreatePipelineCard(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  prospectId: string,
  prospectName: string,
  replyStatus: string,
  userId: string,
  existingClientId: string | null
) {
  const stage = PIPELINE_STAGES[replyStatus];
  if (!stage || existingClientId) return; // not a reply, or already has a card

  const { data: newClient } = await supabase
    .from("ascendry_clients")
    .insert({ name: prospectName, stage, stage_order: 0, created_by: userId })
    .select("id")
    .single();

  if (newClient) {
    await supabase
      .from("ascendry_prospects")
      .update({ pipeline_client_id: newClient.id })
      .eq("id", prospectId);
  }
}

export async function addProspect(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const replyStatus = (formData.get("reply_status") as string) || "No Reply";
  const prospectName = formData.get("prospect_name") as string;

  const { data: prospect, error } = await supabase
    .from("ascendry_prospects")
    .insert({
      prospect_name:    prospectName,
      instagram_handle: (formData.get("instagram_handle") as string) || null,
      date_messaged:    formData.get("date_messaged") as string,
      template_used:    (formData.get("template_used") as string) || null,
      reply_status:     replyStatus,
      call_booked:      formData.get("call_booked") === "true",
      notes:            (formData.get("notes") as string) || null,
      followers_k:      formData.get("followers_k") ? Number(formData.get("followers_k")) : null,
      created_by:       user.id,
    })
    .select("id")
    .single();

  if (error) throw error;

  await maybeCreatePipelineCard(supabase, prospect.id, prospectName, replyStatus, user.id, null);

  revalidatePath("/ascendry/outreach");
  revalidatePath("/ascendry/pipeline");
}

export async function updateProspect(id: string, data: {
  prospect_name?: string;
  instagram_handle?: string | null;
  date_messaged?: string;
  template_used?: string | null;
  reply_status?: string;
  call_booked?: boolean;
  notes?: string | null;
  followers_k?: number | null;
}) {
  const { user, supabase } = await requireAdmin();

  // Fetch current prospect to check if pipeline card already exists
  if (data.reply_status && PIPELINE_STAGES[data.reply_status]) {
    const { data: current } = await supabase
      .from("ascendry_prospects")
      .select("prospect_name, pipeline_client_id")
      .eq("id", id)
      .single();

    if (current) {
      await maybeCreatePipelineCard(
        supabase, id,
        data.prospect_name ?? current.prospect_name,
        data.reply_status,
        user.id,
        current.pipeline_client_id
      );
    }
  }

  const { error } = await supabase
    .from("ascendry_prospects")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/ascendry/outreach");
  revalidatePath("/ascendry/pipeline");
  revalidatePath("/ascendry/analysis");
}

export async function deleteProspect(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("ascendry_prospects").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/ascendry/outreach");
  revalidatePath("/ascendry/analysis");
}

// ── Clients ─────────────────────────────────────────────────

export async function addClient(formData: FormData) {
  const { user, supabase } = await requireAscendryUser();
  const { error } = await supabase.from("ascendry_clients").insert({
    name:        formData.get("name") as string,
    amount_gbp:  formData.get("amount_gbp") ? Number(formData.get("amount_gbp")) : null,
    start_date:  (formData.get("start_date") as string) || null,
    stage:       (formData.get("stage") as string) || "Prospect",
    next_action: (formData.get("next_action") as string) || null,
    notes:       (formData.get("notes") as string) || null,
    stage_order: 0,
    created_by:  user.id,
  });
  if (error) throw error;
  revalidatePath("/ascendry/pipeline");
}

export async function updateClient(id: string, data: {
  name?: string;
  amount_gbp?: number | null;
  start_date?: string | null;
  stage?: string;
  next_action?: string | null;
  notes?: string | null;
  stage_order?: number;
}) {
  const { supabase } = await requireAscendryUser();
  const { error } = await supabase
    .from("ascendry_clients")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/ascendry/pipeline");
}

export async function deleteClient(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("ascendry_clients").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/ascendry/pipeline");
  revalidatePath("/ascendry/metrics");
}

export async function moveClientStage(id: string, stage: string) {
  const { supabase } = await requireAscendryUser();
  const { error } = await supabase
    .from("ascendry_clients")
    .update({ stage, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/ascendry/pipeline");
}

// ── Client Metrics ───────────────────────────────────────────

export async function upsertClientMetric(data: {
  client_id: string;
  week_starting: string;
  calls_booked: number;
  calls_taken: number;
  show_rate_pct: number | null;
  close_rate_pct: number | null;
  revenue_generated: number;
}) {
  const { user, supabase } = await requireAscendryUser();
  const { error } = await supabase
    .from("ascendry_client_metrics")
    .upsert(
      { ...data, logged_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: "client_id,week_starting,logged_by" }
    );
  if (error) throw error;
  revalidatePath("/ascendry/metrics");
}

export async function upsertTemplate(letter: string, name: string, body: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("ascendry_templates")
    .upsert({ letter, name, body, updated_at: new Date().toISOString() }, { onConflict: "letter" });
  if (error) throw error;
  revalidatePath("/ascendry/outreach");
  revalidatePath("/ascendry/analysis");
}

export async function deleteClientMetric(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("ascendry_client_metrics").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/ascendry/metrics");
}

// ── Payments ─────────────────────────────────────────────────

export async function addPayment(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const { error } = await supabase.from("ascendry_payments").insert({
    payment_date: formData.get("payment_date") as string,
    client_name:  formData.get("client_name") as string,
    amount_gbp:   Number(formData.get("amount_gbp")),
    is_overdue:   formData.get("is_overdue") === "true",
    notes:        (formData.get("notes") as string) || null,
    created_by:   user.id,
  });
  if (error) throw error;
  revalidatePath("/ascendry/revenue");
}

export async function updatePayment(id: string, data: {
  payment_date?: string;
  client_name?: string;
  amount_gbp?: number;
  is_overdue?: boolean;
  notes?: string | null;
}) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("ascendry_payments")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/ascendry/revenue");
}

export async function deletePayment(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("ascendry_payments").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/ascendry/revenue");
}
