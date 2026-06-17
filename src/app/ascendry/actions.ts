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

export async function addProspect(formData: FormData) {
  const { user, supabase } = await requireAdmin();
  const { error } = await supabase.from("ascendry_prospects").insert({
    prospect_name:    formData.get("prospect_name") as string,
    instagram_handle: (formData.get("instagram_handle") as string) || null,
    date_messaged:    formData.get("date_messaged") as string,
    template_used:    (formData.get("template_used") as string) || null,
    reply_status:     (formData.get("reply_status") as string) || "No Reply",
    call_booked:      formData.get("call_booked") === "true",
    notes:            (formData.get("notes") as string) || null,
    followers_k:      formData.get("followers_k") ? Number(formData.get("followers_k")) : null,
    created_by:       user.id,
  });
  if (error) throw error;
  revalidatePath("/ascendry/outreach");
}

export async function updateProspect(id: string, data: {
  prospect_name?: string;
  instagram_handle?: string | null;
  date_messaged?: string;
  template_used?: string | null;
  reply_status?: string;
  call_booked?: boolean;
  notes?: string | null;
}) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("ascendry_prospects")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/ascendry/outreach");
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
