import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { IO_TEAM_ID, computeScore, getCurrentWeekMonday } from "@/lib/io-score";

// ── Membership ────────────────────────────────────────────────────────────────

export async function getIsIOmember(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members")
    .select("user_id, team_id");
  if (error) {
    console.error("[getIsIOmember] fetch error:", error.message);
    return false;
  }
  const found = (data ?? []).some(r => r.user_id === userId && r.team_id === IO_TEAM_ID);
  console.log("[getIsIOmember] total rows:", data?.length, "| userId:", userId, "| found:", found);
  return found;
}

// ── Check-ins ─────────────────────────────────────────────────────────────────

export async function getTodayCheckin(userId: string, dateKey: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", userId)
    .eq("checkin_date", dateKey)
    .maybeSingle();
  return data;
}

export async function getRecentCheckins(userId: string, limit = 30) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_checkins")
    .select("*")
    .eq("user_id", userId)
    .order("checkin_date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ── Gym streak (consecutive days with workout_completed = true) ───────────────

export async function getGymStreak(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_checkins")
    .select("checkin_date, workout_completed")
    .eq("user_id", userId)
    .order("checkin_date", { ascending: false })
    .limit(90);

  if (!data || data.length === 0) return 0;

  const completedDates = new Set(
    data.filter(r => r.workout_completed).map(r => r.checkin_date)
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (completedDates.has(key)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ── Training split ────────────────────────────────────────────────────────────

export async function getTrainingSplit(userId: string): Promise<{
  split: Record<number, string>;
  isAdminAssigned: boolean;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("training_splits")
    .select("day_of_week, session_name, assigned_by")
    .eq("user_id", userId)
    .order("day_of_week");

  const split: Record<number, string> = {};
  let isAdminAssigned = false;
  (data ?? []).forEach(r => {
    split[r.day_of_week] = r.session_name;
    if (r.assigned_by && r.assigned_by !== userId) isAdminAssigned = true;
  });
  return { split, isAdminAssigned };
}

// ── Training exercises ────────────────────────────────────────────────────────

export interface TrainingExercise {
  id: string;
  day_of_week: number;
  exercise_order: number;
  exercise_name: string;
  sets: number | null;
  reps: string | null;
  weight: string | null;
}

export async function getTrainingExercises(userId: string): Promise<Record<number, TrainingExercise[]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("training_exercises")
    .select("id, day_of_week, exercise_order, exercise_name, sets, reps, weight")
    .eq("user_id", userId)
    .order("day_of_week")
    .order("exercise_order");

  const result: Record<number, TrainingExercise[]> = {};
  (data ?? []).forEach(ex => {
    if (!result[ex.day_of_week]) result[ex.day_of_week] = [];
    result[ex.day_of_week].push(ex as TrainingExercise);
  });
  return result;
}

// ── Body metrics ──────────────────────────────────────────────────────────────

export async function getBodyMetrics(userId: string, limit = 30) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("body_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ── IO Leaderboard ────────────────────────────────────────────────────────────

type LBTab = "weekly" | "monthly" | "cash" | "streak";

export interface IOLBRow {
  userId: string;
  fullName: string;
  username: string | null;
  role: string;
  trackingPref: "daily" | "weekly";
  score: number;       // avg score for period
  gymStreak: number;
  cashCollected: number;
  checkinsCount: number;
}

export async function getIOLeaderboard(tab: LBTab): Promise<IOLBRow[]> {
  const admin = createAdminClient();

  // Fetch all team_members + profiles, then JS-filter — avoids PostgREST .eq() returning nothing
  const { data: allMembers, error: membersErr } = await admin
    .from("team_members")
    .select("user_id, team_id, profiles(id, full_name, username, role, tracking_preference)");

  if (membersErr) {
    console.error("[getIOLeaderboard] team_members fetch error:", membersErr.message);
    return [];
  }

  const members = (allMembers ?? []).filter(m => m.team_id === IO_TEAM_ID);
  console.log("[getIOLeaderboard] total rows:", allMembers?.length, "| IO members:", members.length);

  if (members.length === 0) return [];

  const userIds = members.map(m => m.user_id);
  const since = new Date();
  if (tab === "weekly")  since.setDate(since.getDate() - 7);
  if (tab === "monthly") since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().split("T")[0];

  // Get check-ins for the period
  const { data: checkins } = await admin
    .from("daily_checkins")
    .select("user_id, checkin_date, performance_score, workout_completed")
    .in("user_id", userIds)
    .gte("checkin_date", tab === "cash" || tab === "streak" ? "2020-01-01" : sinceStr);

  // Get cash from call_logs for cash tab
  let cashMap: Record<string, number> = {};
  if (tab === "cash") {
    const { data: logs } = await admin
      .from("call_logs")
      .select("user_id, cash_collected")
      .in("user_id", userIds);
    (logs ?? []).forEach(l => {
      cashMap[l.user_id] = (cashMap[l.user_id] ?? 0) + (l.cash_collected ?? 0);
    });
  }

  const rows: IOLBRow[] = members.map(m => {
    const profile = m.profiles as unknown as {
      id: string; full_name: string | null; username: string | null;
      role: string; tracking_preference: string;
    };
    const uid = m.user_id;
    const userCheckins = (checkins ?? []).filter(c => c.user_id === uid);

    // Avg score
    const scores = userCheckins.map(c => c.performance_score ?? 0).filter(s => s > 0);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    // Gym streak
    const gymDates = new Set(
      userCheckins.filter(c => c.workout_completed).map(c => c.checkin_date)
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (gymDates.has(d.toISOString().split("T")[0])) streak++;
      else break;
    }

    return {
      userId:        uid,
      fullName:      profile.full_name ?? "Member",
      username:      profile.username,
      role:          profile.role,
      trackingPref:  (profile.tracking_preference as "daily" | "weekly") ?? "daily",
      score:         avgScore,
      gymStreak:     streak,
      cashCollected: cashMap[uid] ?? 0,
      checkinsCount: userCheckins.length,
    };
  });

  // Sort
  if (tab === "weekly" || tab === "monthly") {
    rows.sort((a, b) => b.score - a.score || b.gymStreak - a.gymStreak);
  } else if (tab === "cash") {
    rows.sort((a, b) => b.cashCollected - a.cashCollected);
  } else {
    rows.sort((a, b) => b.gymStreak - a.gymStreak || b.score - a.score);
  }

  return rows;
}

// ── Weekly / monthly avg scores for dashboard ─────────────────────────────────

export async function getScoreAverages(userId: string) {
  const supabase = await createClient();
  const weekAgo  = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

  const { data } = await supabase
    .from("daily_checkins")
    .select("checkin_date, performance_score")
    .eq("user_id", userId)
    .gte("checkin_date", monthAgo.toISOString().split("T")[0])
    .order("checkin_date", { ascending: false });

  const all = (data ?? []).filter(r => r.performance_score > 0);
  const weeklyRecords  = all.filter(r => r.checkin_date >= weekAgo.toISOString().split("T")[0]);
  const avg = (arr: typeof all) =>
    arr.length ? Math.round(arr.reduce((s, r) => s + r.performance_score, 0) / arr.length) : null;

  return {
    weekly:  avg(weeklyRecords),
    monthly: avg(all),
    history: all.slice(0, 14).reverse(), // for sparkline
  };
}

// ── IO member count ────────────────────────────────────────────────────────────

export async function getIOMemberCount(): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members")
    .select("team_id");
  if (error) {
    console.error("[getIOMemberCount]", error.message);
    return 0;
  }
  const n = (data ?? []).filter(r => r.team_id === IO_TEAM_ID).length;
  console.log("[getIOMemberCount] total rows:", data?.length, "| IO count:", n);
  return n;
}
