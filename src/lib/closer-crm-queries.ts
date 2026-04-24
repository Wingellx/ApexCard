import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type FieldType = "number" | "boolean" | "text" | "duration";

export interface CrmFieldDef {
  id: string;
  user_id: string;
  team_id: string | null;
  field_name: string;
  field_label: string;
  field_type: FieldType;
  field_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CrmCustomLog {
  id: string;
  user_id: string;
  team_id: string | null;
  log_date: string;
  field_id: string;
  value_number: number | null;
  value_boolean: boolean | null;
  value_text: string | null;
  created_at: string;
}

export type LogValueMap = Record<string, { number: number | null; boolean: boolean | null; text: string | null }>;

export const DEFAULT_CLOSER_FIELDS: Omit<CrmFieldDef, "id" | "user_id" | "team_id" | "created_at">[] = [
  { field_name: "calls_taken",          field_label: "Calls Taken",          field_type: "number",  field_order: 0, is_active: true },
  { field_name: "calls_closed",         field_label: "Calls Closed",         field_type: "number",  field_order: 1, is_active: true },
  { field_name: "total_revenue",        field_label: "Total Revenue ($)",     field_type: "number",  field_order: 2, is_active: true },
  { field_name: "objections_handled",   field_label: "Objections Handled",   field_type: "number",  field_order: 3, is_active: true },
  { field_name: "no_shows",             field_label: "No Shows",             field_type: "number",  field_order: 4, is_active: true },
];

export async function getCloserFields(userId: string): Promise<CrmFieldDef[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_field_definitions")
    .select("*")
    .eq("user_id", userId)
    .order("field_order", { ascending: true });
  return (data ?? []) as CrmFieldDef[];
}

export async function getTodayCloserLog(userId: string, fields: CrmFieldDef[]): Promise<LogValueMap> {
  if (fields.length === 0) return {};
  const today = new Date().toISOString().split("T")[0];
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_custom_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", today)
    .in("field_id", fields.map(f => f.id));

  const map: LogValueMap = {};
  for (const row of (data ?? []) as CrmCustomLog[]) {
    map[row.field_id] = {
      number:  row.value_number,
      boolean: row.value_boolean,
      text:    row.value_text,
    };
  }
  return map;
}

export async function getCloserLogHistory(userId: string, days = 14): Promise<CrmCustomLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_custom_logs")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(days * 20);
  return (data ?? []) as CrmCustomLog[];
}

// Admin-level: read a team member's fields + logs (for manager view)
export async function getMemberCloserFields(memberId: string): Promise<CrmFieldDef[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_field_definitions")
    .select("*")
    .eq("user_id", memberId)
    .eq("is_active", true)
    .order("field_order", { ascending: true });
  return (data ?? []) as CrmFieldDef[];
}

export async function getMemberCloserLog(memberId: string, logDate: string, fieldIds: string[]): Promise<LogValueMap> {
  if (fieldIds.length === 0) return {};
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_custom_logs")
    .select("*")
    .eq("user_id", memberId)
    .eq("log_date", logDate)
    .in("field_id", fieldIds);

  const map: LogValueMap = {};
  for (const row of (data ?? []) as CrmCustomLog[]) {
    map[row.field_id] = {
      number:  row.value_number,
      boolean: row.value_boolean,
      text:    row.value_text,
    };
  }
  return map;
}
