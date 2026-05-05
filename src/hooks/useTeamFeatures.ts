import { createAdminClient } from "@/lib/supabase/admin";

export interface TeamFeatureFlags {
  crm: boolean;
  stats: boolean;
  leaderboard: boolean;
  offer_board: boolean;
  call_analysis: boolean;
  kpi_dashboard: boolean;
  content_tracker: boolean;
  group_call_tracker: boolean;
}

const DEFAULT_FLAGS: TeamFeatureFlags = {
  crm: false,
  stats: false,
  leaderboard: false,
  offer_board: false,
  call_analysis: false,
  kpi_dashboard: false,
  content_tracker: false,
  group_call_tracker: false,
};

export async function useTeamFeatures(teamId: string): Promise<TeamFeatureFlags> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_features")
    .select("crm, stats, leaderboard, offer_board, call_analysis, kpi_dashboard, content_tracker, group_call_tracker")
    .eq("team_id", teamId)
    .maybeSingle();

  if (error) {
    console.error("[useTeamFeatures] error for teamId=%s:", teamId, error.message);
    return DEFAULT_FLAGS;
  }

  if (!data) return DEFAULT_FLAGS;

  return {
    crm:               !!data.crm,
    stats:             !!data.stats,
    leaderboard:       !!data.leaderboard,
    offer_board:       !!data.offer_board,
    call_analysis:     !!data.call_analysis,
    kpi_dashboard:     !!data.kpi_dashboard,
    content_tracker:   !!data.content_tracker,
    group_call_tracker: !!data.group_call_tracker,
  };
}
