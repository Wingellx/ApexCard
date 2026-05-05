import { createAdminClient } from "@/lib/supabase/admin";

export type EchelonPhase = "learning" | "outreach" | "on_offer";

export interface EchelonMember {
  userId: string;
  teamId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  phase: EchelonPhase;
  phaseUpdatedAt: string | null;
  offerRequestStatus: "none" | "pending" | "approved";
  courseComplete: boolean;
  role: string | null;
  teamRole: string;
}

export interface EchelonMemberDetail extends EchelonMember {
  groupCallCount: number;
  score: number | null;
}

export async function getEchelonMemberData(userId: string): Promise<EchelonMember | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members")
    .select(`
      team_id, role, phase, phase_updated_at, offer_request_status, course_complete,
      profiles(full_name, email, avatar_url, bio, role)
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getEchelonMemberData] error:", error.message);
    return null;
  }
  if (!data) return null;

  type P = { full_name?: string | null; email?: string | null; avatar_url?: string | null; bio?: string | null; role?: string | null };
  const p = data.profiles as P | null;

  return {
    userId,
    teamId:             data.team_id as string,
    name:               p?.full_name?.trim() || p?.email?.split("@")[0] || "Member",
    email:              p?.email ?? "",
    avatarUrl:          p?.avatar_url ?? null,
    bio:                p?.bio ?? null,
    phase:              (data.phase as EchelonPhase) ?? "learning",
    phaseUpdatedAt:     data.phase_updated_at as string | null,
    offerRequestStatus: (data.offer_request_status as "none" | "pending" | "approved") ?? "none",
    courseComplete:     !!data.course_complete,
    role:               p?.role ?? null,
    teamRole:           data.role as string,
  };
}

export async function getEchelonTeamMembers(teamId: string): Promise<EchelonMember[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members")
    .select(`
      user_id, team_id, role, phase, phase_updated_at, offer_request_status, course_complete,
      profiles(full_name, email, avatar_url, bio, role)
    `)
    .eq("team_id", teamId);

  if (error) {
    console.error("[getEchelonTeamMembers] error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    type P = { full_name?: string | null; email?: string | null; avatar_url?: string | null; bio?: string | null; role?: string | null };
    const p = row.profiles as P | null;
    return {
      userId:             row.user_id as string,
      teamId:             row.team_id as string,
      name:               p?.full_name?.trim() || p?.email?.split("@")[0] || "Member",
      email:              p?.email ?? "",
      avatarUrl:          p?.avatar_url ?? null,
      bio:                p?.bio ?? null,
      phase:              (row.phase as EchelonPhase) ?? "learning",
      phaseUpdatedAt:     row.phase_updated_at as string | null,
      offerRequestStatus: (row.offer_request_status as "none" | "pending" | "approved") ?? "none",
      courseComplete:     !!row.course_complete,
      role:               p?.role ?? null,
      teamRole:           row.role as string,
    };
  });
}

// Group call attendance

export async function getGroupCallAttendance(teamId: string, sessionDates: string[]): Promise<Map<string, Set<string>>> {
  if (!sessionDates.length) return new Map();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("group_call_attendance")
    .select("user_id, session_date")
    .eq("team_id", teamId)
    .in("session_date", sessionDates);

  if (error) {
    console.error("[getGroupCallAttendance] error:", error.message);
    return new Map();
  }

  const map = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const uid = row.user_id as string;
    const date = row.session_date as string;
    if (!map.has(uid)) map.set(uid, new Set());
    map.get(uid)!.add(date);
  }
  return map;
}

export async function getUserGroupCallCount(userId: string, teamId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("group_call_attendance")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("team_id", teamId);

  if (error) {
    console.error("[getUserGroupCallCount] error:", error.message);
    return 0;
  }
  return count ?? 0;
}

// Week navigation helpers

export function getWeekSessions(weekOffset = 0): { wednesday: string; sunday: string; weekStart: string; weekEnd: string } {
  const now = new Date();
  now.setDate(now.getDate() + weekOffset * 7);
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);

  function isoDate(d: Date) { return d.toISOString().split("T")[0]; }

  const wednesday = new Date(monday); wednesday.setDate(monday.getDate() + 2);
  const sunday    = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const weekEnd   = sunday;

  return {
    wednesday: isoDate(wednesday),
    sunday:    isoDate(sunday),
    weekStart: isoDate(monday),
    weekEnd:   isoDate(weekEnd),
  };
}

// Outreach logs

export interface OutreachLog {
  id: string;
  logDate: string;
  count: number;
}

export async function getOutreachLogs(userId: string, teamId: string, weekStart: string, weekEnd: string): Promise<OutreachLog[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("outreach_logs")
    .select("id, log_date, count")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .gte("log_date", weekStart)
    .lte("log_date", weekEnd)
    .order("log_date", { ascending: false });

  if (error) {
    console.error("[getOutreachLogs] error:", error.message);
    return [];
  }
  return (data ?? []).map(r => ({
    id:      r.id as string,
    logDate: r.log_date as string,
    count:   r.count as number,
  }));
}

// Echelon applications (outreach phase tracking)

export interface EchelonApplication {
  id: string;
  companyName: string;
  appliedDate: string;
  notes: string | null;
  followUpDate: string | null;
  followUpDone: boolean;
  status: string;
}

export async function getEchelonApplications(userId: string, teamId: string): Promise<EchelonApplication[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("echelon_applications")
    .select("id, company_name, applied_date, notes, follow_up_date, follow_up_done, status")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .order("applied_date", { ascending: false });

  if (error) {
    console.error("[getEchelonApplications] error:", error.message);
    return [];
  }
  return (data ?? []).map(r => ({
    id:           r.id as string,
    companyName:  r.company_name as string,
    appliedDate:  r.applied_date as string,
    notes:        r.notes as string | null,
    followUpDate: r.follow_up_date as string | null,
    followUpDone: !!r.follow_up_done,
    status:       r.status as string,
  }));
}

// Team scores

export async function getTeamScores(teamId: string): Promise<Map<string, number>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_scores")
    .select("user_id, score")
    .eq("team_id", teamId);

  if (error) {
    console.error("[getTeamScores] error:", error.message);
    return new Map();
  }
  return new Map((data ?? []).map(r => [r.user_id as string, Number(r.score ?? 0)]));
}

export async function getUserScore(userId: string, teamId: string): Promise<number | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_scores")
    .select("score")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (error) {
    console.error("[getUserScore] error:", error.message);
    return null;
  }
  return data ? Number(data.score) : null;
}

// Manager notes

export async function getManagerNote(userId: string, teamId: string, managerId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("manager_notes")
    .select("note")
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .eq("manager_id", managerId)
    .maybeSingle();

  if (error) {
    console.error("[getManagerNote] error:", error.message);
    return null;
  }
  return data?.note ?? null;
}

// Phase history logging

export async function logPhaseHistory({
  userId, teamId, fromPhase, toPhase, changedBy,
}: {
  userId: string;
  teamId: string;
  fromPhase: string;
  toPhase: string;
  changedBy: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("phase_history")
    .insert({ user_id: userId, team_id: teamId, from_phase: fromPhase, to_phase: toPhase, changed_by: changedBy, changed_at: new Date().toISOString() });

  if (error) console.error("[logPhaseHistory] error:", error.message);
}
