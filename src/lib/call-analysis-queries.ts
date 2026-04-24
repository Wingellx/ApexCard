import { createAdminClient } from "@/lib/supabase/admin";

export type CallOutcome = "closed" | "no_show" | "not_interested" | "follow_up" | "objection_lost";
export type AnalysisStatus = "none" | "processing" | "complete" | "failed";

export type AnalysisResult = {
  objections: {
    objection_type: string;
    objection_text: string;
    handled: boolean;
    resolution_text: string;
  }[];
  talk_listen_ratio: string;
  tonality_score: number;
  confidence_score: number;
  key_mistakes: string[];
  key_strengths: string[];
  coaching_summary: string;
  focus_area: string;
};

export type CallRecord = {
  id: string;
  user_id: string;
  team_id: string | null;
  lead_name: string;
  call_date: string;
  call_outcome: CallOutcome;
  deal_value: number | null;
  recording_url: string | null;
  notes: string | null;
  transcript: string | null;
  analysis_status: AnalysisStatus;
  analysis_result: AnalysisResult | null;
  created_at: string;
  updated_at: string;
};

export type ImprovementMetric = {
  id: string;
  user_id: string;
  month: string;
  calls_analysed: number;
  avg_handle_rate: number;
  most_common_objection: string | null;
  close_rate: number;
  improvement_score: number;
  top_weakness: string | null;
  top_strength: string | null;
  created_at: string;
};

export async function getCallRecords(userId: string, limit = 100): Promise<CallRecord[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("closer_call_records")
    .select("*")
    .eq("user_id", userId)
    .order("call_date",   { ascending: false })
    .order("created_at",  { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CallRecord[];
}

export async function getImprovementMetrics(userId: string, limit = 12): Promise<ImprovementMetric[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("closer_improvement_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("month", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ImprovementMetric[];
}

export async function getRecentFocusAreas(userId: string, limit = 5): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("closer_call_records")
    .select("analysis_result")
    .eq("user_id", userId)
    .eq("analysis_status", "complete")
    .order("call_date", { ascending: false })
    .limit(limit);
  return (data ?? [])
    .map(r => (r.analysis_result as AnalysisResult | null)?.focus_area)
    .filter(Boolean) as string[];
}

export async function getCallObjectionsByMonth(userId: string): Promise<{
  thisMonth: { type: string; count: number }[];
  lastMonth: { type: string; count: number }[];
}> {
  const admin = createAdminClient();
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  // Use Date.UTC so .toISOString().split("T")[0] always gives the correct date
  // regardless of the server's local timezone.
  const thisMonthStart = new Date(Date.UTC(y, m,     1)).toISOString().split("T")[0];
  const lastMonthStart = new Date(Date.UTC(y, m - 1, 1)).toISOString().split("T")[0];
  const lastMonthEnd   = new Date(Date.UTC(y, m,     0)).toISOString().split("T")[0];

  const [thisRes, lastRes] = await Promise.all([
    admin.from("closer_call_records").select("id").eq("user_id", userId).gte("call_date", thisMonthStart),
    admin.from("closer_call_records").select("id").eq("user_id", userId).gte("call_date", lastMonthStart).lte("call_date", lastMonthEnd),
  ]);

  const thisIds = (thisRes.data ?? []).map(r => r.id);
  const lastIds = (lastRes.data ?? []).map(r => r.id);

  const [thisObjs, lastObjs] = await Promise.all([
    thisIds.length ? admin.from("call_objections").select("objection_type").in("call_record_id", thisIds) : Promise.resolve({ data: [] as { objection_type: string }[] }),
    lastIds.length ? admin.from("call_objections").select("objection_type").in("call_record_id", lastIds) : Promise.resolve({ data: [] as { objection_type: string }[] }),
  ]);

  function countByType(rows: { objection_type: string }[]) {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.objection_type, (map.get(r.objection_type) ?? 0) + 1);
    return [...map.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }

  return {
    thisMonth: countByType(thisObjs.data ?? []),
    lastMonth: countByType(lastObjs.data ?? []),
  };
}
