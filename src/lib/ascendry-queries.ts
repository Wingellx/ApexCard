import { createClient } from "@/lib/supabase/server";

export type AscendryRole = "admin" | "delivery";

export interface AscendryUser {
  user_id: string;
  role: AscendryRole;
  display_name: string;
}

export interface Prospect {
  id: string;
  prospect_name: string;
  instagram_handle: string | null;
  date_messaged: string;
  template_used: "A" | "B" | "C" | "D" | "E" | null;
  reply_status: "No Reply" | "Replied" | "Positive" | "Call Booked";
  call_booked: boolean;
  notes: string | null;
  followers_k: number | null;
  created_at: string;
}

export interface AscendryClient {
  id: string;
  name: string;
  amount_gbp: number | null;
  start_date: string | null;
  stage: "Prospect" | "Replied" | "Call Booked" | "Closed" | "Active Client" | "60-Day Review" | "Exited";
  next_action: string | null;
  notes: string | null;
  stage_order: number;
  created_at: string;
}

export interface ClientMetric {
  id: string;
  client_id: string;
  week_starting: string;
  calls_booked: number;
  calls_taken: number;
  show_rate_pct: number | null;
  close_rate_pct: number | null;
  revenue_generated: number;
  logged_by: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_date: string;
  client_name: string;
  amount_gbp: number;
  is_overdue: boolean;
  notes: string | null;
  created_at: string;
}

export async function getAscendryUser(userId: string): Promise<AscendryUser | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ascendry_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function getProspects(): Promise<Prospect[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ascendry_prospects")
    .select("*")
    .order("date_messaged", { ascending: false });
  return (data as Prospect[]) ?? [];
}

export async function getClients(): Promise<AscendryClient[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ascendry_clients")
    .select("*")
    .order("stage_order", { ascending: true });
  return (data as AscendryClient[]) ?? [];
}

export async function getClientMetrics(clientId?: string): Promise<ClientMetric[]> {
  const supabase = await createClient();
  let query = supabase
    .from("ascendry_client_metrics")
    .select("*")
    .order("week_starting", { ascending: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data } = await query;
  return (data as ClientMetric[]) ?? [];
}

export async function getPayments(): Promise<Payment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ascendry_payments")
    .select("*")
    .order("payment_date", { ascending: false });
  return (data as Payment[]) ?? [];
}

export interface AscendryTemplate {
  letter: "A" | "B" | "C" | "D" | "E";
  name: string;
  body: string;
}

export async function getTemplates(): Promise<AscendryTemplate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ascendry_templates")
    .select("*")
    .order("letter");
  return (data as AscendryTemplate[]) ?? [];
}

export async function getAscendryUsers(): Promise<AscendryUser[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ascendry_users")
    .select("*")
    .order("display_name");
  return (data as AscendryUser[]) ?? [];
}
