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
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const { data } = await supabase
    .from("crm_custom_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", sinceStr)
    .order("log_date", { ascending: false });

  return (data ?? []) as CrmCustomLog[];
}

export async function getCloserMonthLogs(userId: string, year: number, month: number): Promise<CrmCustomLog[]> {
  const supabase = await createClient();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data } = await supabase
    .from("crm_custom_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", start)
    .lte("log_date", end);

  return (data ?? []) as CrmCustomLog[];
}

export async function getCloserLast30DaysLogs(userId: string): Promise<CrmCustomLog[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().split("T")[0];

  const { data } = await supabase
    .from("crm_custom_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", sinceStr)
    .order("log_date", { ascending: true });

  return (data ?? []) as CrmCustomLog[];
}

export async function getCloserAllLogDates(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("crm_custom_logs")
    .select("log_date")
    .eq("user_id", userId);

  return [...new Set((data ?? []).map(r => (r as { log_date: string }).log_date))];
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
