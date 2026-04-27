"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserTeam } from "@/lib/queries";
import { CRM_TEMPLATES, type TemplateKey } from "@/lib/crm-templates";
import type { CrmFieldDef, FieldType } from "@/lib/closer-crm-queries";

async function getAuthedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ── Template seeding ─────────────────────────────────────────────────────────

export async function applyTemplate(
  template: TemplateKey
): Promise<{ fields?: CrmFieldDef[]; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Unauthorized" };

  const userTeam = await getUserTeam(user.id);
  const admin    = createAdminClient();

  const { data, error } = await admin
    .from("crm_field_definitions")
    .insert(
      CRM_TEMPLATES[template].fields.map(f => ({
        ...f,
        user_id: user.id,
        team_id: userTeam?.teamId ?? null,
      }))
    )
    .select();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/crm");
  return { fields: (data ?? []) as CrmFieldDef[] };
}

export async function addTemplateFields(
  template: TemplateKey
): Promise<{ fields?: CrmFieldDef[]; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Unauthorized" };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("crm_field_definitions")
    .select("field_order")
    .eq("user_id", user.id)
    .order("field_order", { ascending: false })
    .limit(1);

  const startOrder = ((existing?.[0]?.field_order as number) ?? -1) + 1;
  const userTeam   = await getUserTeam(user.id);

  const { data, error } = await admin
    .from("crm_field_definitions")
    .insert(
      CRM_TEMPLATES[template].fields.map((f, i) => ({
        ...f,
        field_order: startOrder + i,
        user_id: user.id,
        team_id: userTeam?.teamId ?? null,
      }))
    )
    .select();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/crm");
  return { fields: (data ?? []) as CrmFieldDef[] };
}

// ── Field CRUD ────────────────────────────────────────────────────────────────

export async function addCloserField(formData: FormData): Promise<{ field?: CrmFieldDef; error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Unauthorized" };

  const label = (formData.get("field_label") as string)?.trim();
  const type  = formData.get("field_type") as FieldType;

  if (!label) return { error: "Label is required" };
  if (!["number", "boolean", "text", "duration"].includes(type)) return { error: "Invalid type" };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("crm_field_definitions")
    .select("field_order")
    .eq("user_id", user.id)
    .order("field_order", { ascending: false })
    .limit(1);

  const nextOrder = ((existing?.[0]?.field_order as number) ?? -1) + 1;
  const userTeam  = await getUserTeam(user.id);
  const fieldName = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") + "_" + Date.now();

  const { data, error } = await admin
    .from("crm_field_definitions")
    .insert({
      user_id:     user.id,
      team_id:     userTeam?.teamId ?? null,
      field_name:  fieldName,
      field_label: label,
      field_type:  type,
      field_order: nextOrder,
      is_active:   true,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/crm");
  return { field: data as CrmFieldDef };
}

export async function toggleCloserField(fieldId: string, isActive: boolean): Promise<void> {
  const user = await getAuthedUser();
  if (!user) return;
  const admin = createAdminClient();
  await admin.from("crm_field_definitions").update({ is_active: isActive }).eq("id", fieldId).eq("user_id", user.id);
  revalidatePath("/dashboard/crm");
}

export async function deleteCloserField(fieldId: string): Promise<void> {
  const user = await getAuthedUser();
  if (!user) return;
  const admin = createAdminClient();
  await admin.from("crm_field_definitions").delete().eq("id", fieldId).eq("user_id", user.id);
  revalidatePath("/dashboard/crm");
}

export async function reorderCloserFields(orderedIds: string[]): Promise<void> {
  const user = await getAuthedUser();
  if (!user) return;
  const admin = createAdminClient();
  await Promise.all(
    orderedIds.map((id, idx) =>
      admin.from("crm_field_definitions").update({ field_order: idx }).eq("id", id).eq("user_id", user.id)
    )
  );
  revalidatePath("/dashboard/crm");
}

// ── Log saving ────────────────────────────────────────────────────────────────

export async function saveCloserDailyLog(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await getAuthedUser();
  if (!user) return { error: "Unauthorized" };

  const logDate  = (formData.get("log_date") as string) ?? new Date().toISOString().split("T")[0];
  const fieldIds = (formData.get("field_ids") as string ?? "").split(",").filter(Boolean);
  if (fieldIds.length === 0) return {};

  const admin    = createAdminClient();
  const userTeam = await getUserTeam(user.id);

  const { data: fields } = await admin
    .from("crm_field_definitions")
    .select("id, field_type")
    .eq("user_id", user.id)
    .in("id", fieldIds);

  if (!fields?.length) return {};

  const rows = (fields as { id: string; field_type: string }[]).map(f => {
    const raw = formData.get(`field_${f.id}`);
    const row: Record<string, unknown> = {
      user_id:       user.id,
      team_id:       userTeam?.teamId ?? null,
      log_date:      logDate,
      field_id:      f.id,
      value_number:  null,
      value_boolean: null,
      value_text:    null,
    };

    if (f.field_type === "number" || f.field_type === "duration") {
      row.value_number = raw !== null && raw !== "" ? Number(raw) : null;
    } else if (f.field_type === "boolean") {
      row.value_boolean = raw === "true";
    } else {
      row.value_text = raw !== null ? String(raw) : null;
    }
    return row;
  });

  const { error } = await admin
    .from("crm_custom_logs")
    .upsert(rows, { onConflict: "user_id,field_id,log_date" });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/crm");
  return {};
}
