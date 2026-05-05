import { createAdminClient } from "@/lib/supabase/admin";
import { thisWeekBounds } from "@/lib/queries";

export interface EchelonScoreBreakdown {
  total: number;
  phase: "learning" | "outreach" | "on_offer";
  components: Record<string, { label: string; points: number; max: number }>;
}

export async function calculateEchelonScore(
  userId: string,
  teamId: string
): Promise<EchelonScoreBreakdown> {
  const admin = createAdminClient();

  // Fetch member data
  const { data: member, error: memberErr } = await admin
    .from("team_members")
    .select("phase, course_complete")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (memberErr || !member) {
    console.error("[calculateEchelonScore] member fetch error:", memberErr?.message);
    return { total: 0, phase: "learning", components: {} };
  }

  const phase = (member.phase as "learning" | "outreach" | "on_offer") ?? "learning";

  if (phase === "learning") return scoreLearning(userId, teamId, !!member.course_complete);
  if (phase === "outreach") return scoreOutreach(userId, teamId);
  return scoreOnOffer(userId, teamId);
}

// ── Learning phase (0–100) ──────────────────────────────────────────────────

async function scoreLearning(
  userId: string,
  teamId: string,
  courseComplete: boolean
): Promise<EchelonScoreBreakdown> {
  const admin = createAdminClient();
  const { start, end } = thisWeekBounds();

  // Group call attendance (all-time, capped at 4)
  const { count: callCount } = await admin
    .from("group_call_attendance")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("team_id", teamId);

  const callsAttended = Math.min(callCount ?? 0, 4);

  // Profile complete (avatar + bio)
  const { data: profile } = await admin
    .from("profiles")
    .select("avatar_url, bio")
    .eq("id", userId)
    .maybeSingle();

  const profileComplete = !!(profile?.avatar_url && profile?.bio?.trim());

  // Logged in this week (check if there's any activity: call_log, outreach_log, or crm_daily_logs)
  const { count: activityCount } = await admin
    .from("call_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("date", start)
    .lte("date", end);

  const loggedInThisWeek = (activityCount ?? 0) > 0;

  const coursePoints  = courseComplete  ? 40 : 0;
  const callPoints    = callsAttended * 10;
  const profilePoints = profileComplete ? 10 : 0;
  const loginPoints   = loggedInThisWeek ? 10 : 0;

  const total = coursePoints + callPoints + profilePoints + loginPoints;

  return {
    total,
    phase: "learning",
    components: {
      course:  { label: "Course Complete",         points: coursePoints,  max: 40 },
      calls:   { label: "Group Calls Attended",    points: callPoints,    max: 40 },
      profile: { label: "Profile Complete",        points: profilePoints, max: 10 },
      login:   { label: "Logged in this week",     points: loginPoints,   max: 10 },
    },
  };
}

// ── Outreach phase (0–100) ──────────────────────────────────────────────────

async function scoreOutreach(userId: string, teamId: string): Promise<EchelonScoreBreakdown> {
  const admin = createAdminClient();
  const { start, end } = thisWeekBounds();

  // Days with outreach logged this week
  const { data: outreachLogs } = await admin
    .from("outreach_logs")
    .select("log_date")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .gte("log_date", start)
    .lte("log_date", end);

  const uniqueDays = new Set((outreachLogs ?? []).map(r => r.log_date as string)).size;
  const outreachPoints = Math.round((uniqueDays / 7) * 40);

  // Offer applications this week (capped at 5)
  const { count: appCount } = await admin
    .from("echelon_applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .gte("applied_date", start)
    .lte("applied_date", end);

  const apps = Math.min(appCount ?? 0, 5);
  const appPoints = apps * 7;

  // Follow-ups completed on time this week (capped at 5)
  const { count: followUpCount } = await admin
    .from("echelon_applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .eq("follow_up_done", true)
    .gte("follow_up_date", start)
    .lte("follow_up_date", end);

  const followUps = Math.min(followUpCount ?? 0, 5);
  const followUpPoints = followUps * 5;

  const total = outreachPoints + appPoints + followUpPoints;

  return {
    total,
    phase: "outreach",
    components: {
      outreach:  { label: "Days with outreach (this week)",   points: outreachPoints,  max: 40 },
      apps:      { label: "Applications submitted (this week)", points: appPoints,      max: 35 },
      followUps: { label: "Follow-ups completed (this week)", points: followUpPoints,  max: 25 },
    },
  };
}

// ── On Offer phase (0–100) ──────────────────────────────────────────────────

async function scoreOnOffer(userId: string, teamId: string): Promise<EchelonScoreBreakdown> {
  const admin = createAdminClient();
  const { start, end } = thisWeekBounds();

  // CRM data for booking/show rates
  const { data: crmLogs } = await admin
    .from("crm_daily_logs")
    .select("calls_booked, calls_pitched")
    .eq("user_id", userId)
    .eq("team_id", teamId);

  const totalBooked  = (crmLogs ?? []).reduce((s, r) => s + (r.calls_booked  ?? 0), 0);
  const totalPitched = (crmLogs ?? []).reduce((s, r) => s + (r.calls_pitched ?? 0), 0);

  // Booking rate: booked ÷ contacted
  const bookingRate = totalPitched > 0 ? totalBooked / totalPitched : 0;
  const bookingPoints = Math.round(bookingRate * 35);

  // Show rate: pitched and showed (using calls_pitched as proxy for showed)
  // TODO: replace with dedicated showed column when available
  const showRate = totalBooked > 0 ? Math.min(totalPitched / (totalBooked || 1), 1) : 0;
  const showPoints = Math.round(showRate * 35);

  // Calls logged this week vs target of 20
  const { data: weekLogs } = await admin
    .from("crm_daily_logs")
    .select("calls_pitched")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .gte("log_date", start)
    .lte("log_date", end);

  const weekCalls = (weekLogs ?? []).reduce((s, r) => s + (r.calls_pitched ?? 0), 0);
  const callPoints = Math.round(Math.min(weekCalls / 20, 1) * 30);

  const total = bookingPoints + showPoints + callPoints;

  return {
    total,
    phase: "on_offer",
    components: {
      bookingRate: { label: "Booking rate",           points: bookingPoints, max: 35 },
      showRate:    { label: "Show rate",              points: showPoints,    max: 35 },
      calls:       { label: "Calls logged this week", points: callPoints,    max: 30 },
    },
  };
}

// ── Store / recalculate ─────────────────────────────────────────────────────

export async function upsertScore(userId: string, teamId: string, score: number): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("team_scores")
    .upsert(
      { user_id: userId, team_id: teamId, score, calculated_at: new Date().toISOString() },
      { onConflict: "user_id,team_id" }
    );
  if (error) console.error("[upsertScore] error:", error.message);
}

export async function recalculateTeamScores(teamId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("team_members")
    .select("user_id")
    .eq("team_id", teamId);

  await Promise.all(
    (members ?? []).map(async (m) => {
      const breakdown = await calculateEchelonScore(m.user_id as string, teamId);
      await upsertScore(m.user_id as string, teamId, breakdown.total);
    })
  );
}
