import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function monthBounds() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const last = new Date(y, m + 1, 0).toISOString().split("T")[0];
  return { first, last, monthDate: first };
}

export function thisMonthBounds() {
  return monthBounds();
}

function nDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

// ── Week / month bound helpers (exported) ────────────────────────

function isoDate(d: Date) { return d.toISOString().split("T")[0]; }

export function thisWeekBounds() {
  const now  = new Date();
  const day  = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // days back to Monday
  const mon  = new Date(now); mon.setDate(now.getDate() + diff);
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: isoDate(mon), end: isoDate(sun) };
}

export function lastWeekBounds() {
  const { start } = thisWeekBounds();
  const sun = new Date(start + "T00:00:00"); sun.setDate(sun.getDate() - 1);
  const mon = new Date(sun);                 mon.setDate(sun.getDate() - 6);
  return { start: isoDate(mon), end: isoDate(sun) };
}

export function lastMonthBounds() {
  const now = new Date();
  const lm  = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const ly  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const first = `${ly}-${String(lm + 1).padStart(2, "0")}-01`;
  const last  = new Date(ly, lm + 1, 0).toISOString().split("T")[0];
  const label = new Date(ly, lm, 1).toLocaleDateString("en-US", { month: "long" });
  return { first, last, label };
}

// ── Best-period computation (pure, no DB call) ───────────────────

type RawLog = {
  date: string;
  calls_taken?:      number | null;
  shows?:            number | null;
  offers_taken?:     number | null;
  cash_collected?:   number | string | null;
  commission_earned?: number | string | null;
};

type PeriodStats = {
  key:        string;
  cash:       number;
  calls:      number;
  shows:      number;
  offersTaken: number;
  commission: number;
  days:       number;
};

function mondayOf(dateStr: string): string {
  const d   = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return isoDate(d);
}

export function weekRangeLabel(mondayStr: string): string {
  const mon = new Date(mondayStr + "T00:00:00");
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const o: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${mon.toLocaleDateString("en-US", o)} – ${sun.toLocaleDateString("en-US", o)}, ${sun.getFullYear()}`;
}

export function monthKeyLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function computeBestPeriods(logs: RawLog[]): {
  bestWeek:  PeriodStats | null;
  bestMonth: PeriodStats | null;
} {
  if (!logs.length) return { bestWeek: null, bestMonth: null };

  const weeks  = new Map<string, PeriodStats>();
  const months = new Map<string, PeriodStats>();

  for (const log of logs) {
    const cash        = Number(log.cash_collected    ?? 0);
    const commission  = Number(log.commission_earned ?? 0);
    const calls       = log.calls_taken  ?? 0;
    const shows       = log.shows         ?? 0;
    const offersTaken = log.offers_taken  ?? 0;

    const wk = mondayOf(log.date);
    const w  = weeks.get(wk) ?? { key: wk, cash: 0, calls: 0, shows: 0, offersTaken: 0, commission: 0, days: 0 };
    weeks.set(wk, { key: wk, cash: w.cash + cash, calls: w.calls + calls, shows: w.shows + shows, offersTaken: w.offersTaken + offersTaken, commission: w.commission + commission, days: w.days + 1 });

    const mk = log.date.slice(0, 7);
    const mo = months.get(mk) ?? { key: mk, cash: 0, calls: 0, shows: 0, offersTaken: 0, commission: 0, days: 0 };
    months.set(mk, { key: mk, cash: mo.cash + cash, calls: mo.calls + calls, shows: mo.shows + shows, offersTaken: mo.offersTaken + offersTaken, commission: mo.commission + commission, days: mo.days + 1 });
  }

  let bestWeek:  PeriodStats | null = null;
  for (const s of weeks.values())  if (!bestWeek  || s.cash > bestWeek.cash)  bestWeek  = s;

  let bestMonth: PeriodStats | null = null;
  for (const s of months.values()) if (!bestMonth || s.cash > bestMonth.cash) bestMonth = s;

  return { bestWeek, bestMonth };
}

export async function getDateRangeLogs(userId: string, from: string, to: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("call_logs")
    .select("date, calls_taken, shows, offers_made, offers_taken, cash_collected, commission_earned")
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });
  return data ?? [];
}

export async function getMonthCallLogs(userId: string) {
  const supabase = await createClient();
  const { first, last } = monthBounds();
  const { data, error } = await supabase
    .from("call_logs")
    .select("date, calls_taken, shows, offers_made, offers_taken, cash_collected, commission_earned, notes")
    .eq("user_id", userId)
    .gte("date", first)
    .lte("date", last)
    .order("date", { ascending: false });
  return { rows: data ?? [], error };
}

export async function getLast30DaysLogs(userId: string) {
  const supabase = await createClient();
  const from = nDaysAgo(30);
  const { data } = await supabase
    .from("call_logs")
    .select("date, calls_taken, shows, offers_made, offers_taken, cash_collected, commission_earned")
    .eq("user_id", userId)
    .gte("date", from)
    .order("date", { ascending: true });
  return data ?? [];
}

export async function getAllCallLogs(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("call_logs")
    .select("id, date, calls_taken, shows, offers_made, offers_taken, cash_collected, commission_earned, notes")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) console.error("[getAllCallLogs] Supabase error:", error.message, error.details, error.hint);
  return data ?? [];
}

export async function getLoggedDates(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("call_logs")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  return (data ?? []).map((r) => r.date as string);
}

export function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const unique = [...new Set(dates)].sort().reverse();
  const todayStr = new Date().toISOString().split("T")[0];
  const yestStr  = new Date(Date.now() - 864e5).toISOString().split("T")[0];
  if (unique[0] !== todayStr && unique[0] !== yestStr) return 0;
  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 864e5);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

export async function getMonthGoals(userId: string) {
  const supabase = await createClient();
  const { monthDate } = monthBounds();
  const { data } = await supabase
    .from("goals")
    .select("calls_target, show_rate_target, close_rate_target, offers_target, cash_target, commission_target")
    .eq("user_id", userId)
    .eq("month", monthDate)
    .maybeSingle();
  return data;
}

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email, username")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function getProfileFull(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email, username, role, bio, leaderboard_opt_in, onboarding_completed, account_type, verified_owner, discoverable, contact_enabled, subscription_status, trial_ends_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) console.error("[getProfileFull] Supabase error:", error.message, error.details, error.hint);
  return data;
}

export async function getUserIdByUsername(username: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data?.id ?? null;
}

// ── Leaderboard ─────────────────────────────────────────────────

export type LeaderboardPeriod = "alltime" | "monthly" | "30d" | "7d";
export type LeaderboardMetric = "cash" | "close_rate" | "calls" | "offers";

export interface LeaderboardOptions {
  period:       LeaderboardPeriod;
  metric:       LeaderboardMetric;
  role?:        string | null;
  verifiedOnly?: boolean;
}

export interface LeaderboardEntry {
  id:                 string;
  name:               string;
  username:           string | null;
  role:               string | null;
  is_verified:        boolean;
  total_cash:         number;
  total_calls:        number;
  total_shows:        number;
  total_offers_taken: number;
  close_rate:         number;
  days_logged:        number;
}

const MIN_DAYS: Record<LeaderboardPeriod, number> = {
  alltime: 5,
  monthly: 3,
  "30d":   2,
  "7d":    1,
};

export async function getLeaderboard(opts: LeaderboardOptions): Promise<LeaderboardEntry[]> {
  const admin = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  let startDate: string | null = null;
  let endDate:   string | null = null;

  if (opts.period === "monthly") {
    const { first, last } = monthBounds();
    startDate = first;
    endDate   = last;
  } else if (opts.period === "30d") {
    startDate = nDaysAgo(30);
    endDate   = today;
  } else if (opts.period === "7d") {
    startDate = nDaysAgo(7);
    endDate   = today;
  }

  const { data } = await admin.rpc("get_leaderboard_v2", {
    p_start_date: startDate,
    p_end_date:   endDate,
    p_role:       opts.role || null,
    p_verified:   opts.verifiedOnly ?? false,
    p_order_by:   opts.metric,
    p_min_days:   MIN_DAYS[opts.period],
  });

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id:                 r.id                 as string,
    name:               r.name               as string,
    username:           r.username           as string | null,
    role:               r.role               as string | null,
    is_verified:        Boolean(r.is_verified),
    total_cash:         Number(r.total_cash),
    total_calls:        Number(r.total_calls),
    total_shows:        Number(r.total_shows),
    total_offers_taken: Number(r.total_offers_taken),
    close_rate:         Number(r.close_rate),
    days_logged:        Number(r.days_logged),
  }));
}

export async function getUserMonthlyLeaderboardRank(userId: string): Promise<number | null> {
  const entries = await getLeaderboard({ period: "monthly", metric: "cash" });
  const idx = entries.findIndex((e) => e.id === userId);
  if (idx === -1 || idx >= 10) return null;
  return idx + 1;
}

// ── Public stats (admin client — bypasses RLS) ──────────────────
export async function getPublicLifetimeStats(userId: string) {
  const admin = createAdminClient();

  const [{ data: logs }, { data: profile }] = await Promise.all([
    admin
      .from("call_logs")
      .select("date, calls_taken, shows, offers_made, offers_taken, cash_collected, commission_earned")
      .eq("user_id", userId),
    admin
      .from("profiles")
      .select("full_name, email, is_verified, verified_by_name, verified_by_company, username, role")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (!logs || logs.length === 0) return null;

  const totals = logs.reduce(
    (a, r) => ({
      calls:       a.calls       + (r.calls_taken       ?? 0),
      shows:       a.shows       + (r.shows             ?? 0),
      offersMade:  a.offersMade  + (r.offers_made       ?? 0),
      offersTaken: a.offersTaken + (r.offers_taken      ?? 0),
      cash:        a.cash        + Number(r.cash_collected    ?? 0),
      commission:  a.commission  + Number(r.commission_earned ?? 0),
    }),
    { calls: 0, shows: 0, offersMade: 0, offersTaken: 0, cash: 0, commission: 0 }
  );

  const showRate     = totals.calls        > 0 ? (totals.shows       / totals.calls)       * 100 : 0;
  const closeRate    = totals.shows        > 0 ? (totals.offersTaken / totals.shows)       * 100 : 0;
  const cashPerClose = totals.offersTaken  > 0 ?  totals.cash        / totals.offersTaken        : 0;
  const bestDay      = Math.max(...logs.map((r) => Number(r.cash_collected ?? 0)));
  const daysLogged   = logs.length;
  const name            = profile?.full_name?.trim() || profile?.email?.split("@")[0] || "Sales Pro";
  const isVerified        = profile?.is_verified        ?? false;
  const verifiedByName    = profile?.verified_by_name    ?? null;
  const verifiedByCompany = profile?.verified_by_company ?? null;
  const username          = profile?.username             ?? null;
  const role              = profile?.role                 ?? null;
  const sortedDates       = [...logs.map((r) => r.date as string)].sort().reverse();
  const streak            = calculateStreak(sortedDates);

  return { totals, showRate, closeRate, cashPerClose, bestDay, daysLogged, name, isVerified, verifiedByName, verifiedByCompany, username, role, streak };
}

// ── Teams ────────────────────────────────────────────────────

export type UserTeam = {
  teamId: string;
  team: {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    invite_code: string;
  };
};

export async function getUserTeam(userId: string): Promise<UserTeam | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_members")
    .select("team_id, teams(id, name, description, logo_url, invite_code)")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    teamId: data.team_id as string,
    team: data.teams as unknown as UserTeam["team"],
  };
}

export async function getTeamByInviteCode(inviteCode: string) {
  const admin = createAdminClient();

  // Fetch all teams and filter in JS — avoids any column/RLS mismatch issue
  const { data: teams, error } = await admin
    .from("teams")
    .select("id, name, description, logo_url, invite_code");

  if (error) {
    console.error("[getTeamByInviteCode] query error:", error.message, error.details);
    return null;
  }

  console.log("[getTeamByInviteCode] looking for:", JSON.stringify(inviteCode), "| all codes:", teams?.map(t => t.invite_code));

  const team = (teams ?? []).find(
    t => t.invite_code.trim() === inviteCode.trim()
  );

  if (!team) return null;

  const { data: teamMembersData } = await admin
    .from("team_members")
    .select("team_id");

  const memberCount = (teamMembersData ?? []).filter(r => r.team_id === team.id).length;

  return {
    id:          team.id          as string,
    name:        team.name        as string,
    description: team.description as string | null,
    logo_url:    team.logo_url    as string | null,
    memberCount,
  };
}

export type TeamMemberStat = {
  userId:           string;
  name:             string;
  username:         string | null;
  role:             string | null;
  isVerified:       boolean;
  totalCash:        number;
  totalCalls:       number;
  totalOffersTaken: number;
  closeRate:        number;
};

export async function getTeamLeaderboard(
  teamId: string,
  startDate?: string,
  endDate?: string
): Promise<TeamMemberStat[]> {
  const admin = createAdminClient();

  const { data: allMembers, error: membersErr } = await admin
    .from("team_members")
    .select("user_id, team_id, profiles(full_name, email, username, role, is_verified)");

  if (membersErr) {
    console.error("[getTeamLeaderboard] team_members fetch error:", membersErr.message);
    return [];
  }

  const members = (allMembers ?? []).filter(m => m.team_id === teamId);
  console.log("[getTeamLeaderboard] total rows:", allMembers?.length, "| team members:", members.length, "| teamId:", teamId);

  if (!members.length) return [];

  const userIds = members.map((m) => m.user_id as string);

  let query = admin
    .from("call_logs")
    .select("user_id, calls_taken, shows, offers_taken, cash_collected")
    .in("user_id", userIds);
  if (startDate) query = query.gte("date", startDate);
  if (endDate)   query = query.lte("date", endDate);

  const { data: logs } = await query;

  const byUser = new Map<string, { calls: number; shows: number; offersTaken: number; cash: number }>();
  for (const uid of userIds) byUser.set(uid, { calls: 0, shows: 0, offersTaken: 0, cash: 0 });
  for (const log of logs ?? []) {
    const agg = byUser.get(log.user_id as string);
    if (!agg) continue;
    agg.calls       += log.calls_taken  ?? 0;
    agg.shows       += log.shows        ?? 0;
    agg.offersTaken += log.offers_taken ?? 0;
    agg.cash        += Number(log.cash_collected ?? 0);
  }

  return members
    .map((m) => {
      type P = { full_name?: string | null; email?: string | null; username?: string | null; role?: string | null; is_verified?: boolean | null };
      const p = m.profiles as P | null;
      const agg = byUser.get(m.user_id as string)!;
      return {
        userId:           m.user_id as string,
        name:             p?.full_name?.trim() || p?.email?.split("@")[0] || "Member",
        username:         p?.username ?? null,
        role:             p?.role ?? null,
        isVerified:       p?.is_verified ?? false,
        totalCash:        agg.cash,
        totalCalls:       agg.calls,
        totalOffersTaken: agg.offersTaken,
        closeRate:        agg.shows > 0 ? (agg.offersTaken / agg.shows) * 100 : 0,
      };
    })
    .sort((a, b) => b.totalCash - a.totalCash);
}

// ── Owner portal ─────────────────────────────────────────────

export type DiscoverableRep = {
  id:             string;
  name:           string;
  username:       string | null;
  role:           string | null;
  isVerified:     boolean;
  bio:            string | null;
  contactEnabled: boolean;
  totalCash:      number;
  closeRate:      number;
  daysLogged:     number;
};

export async function getDiscoverableReps(search?: string): Promise<DiscoverableRep[]> {
  const admin = createAdminClient();

  let q = admin
    .from("profiles")
    .select("id, full_name, email, username, role, is_verified, bio, contact_enabled")
    .eq("account_type", "rep")
    .eq("discoverable", true);

  if (search?.trim()) {
    const s = search.trim().replace(/[%_]/g, "\\$&");
    q = q.or(`full_name.ilike.%${s}%,username.ilike.%${s}%`);
  }

  const { data: reps } = await q.order("full_name");
  if (!reps?.length) return [];

  const repIds = reps.map((r) => r.id as string);
  const { data: logs } = await admin
    .from("call_logs")
    .select("user_id, shows, offers_taken, cash_collected")
    .in("user_id", repIds);

  const byUser = new Map<string, { shows: number; offersTaken: number; cash: number; days: number }>();
  for (const rid of repIds) byUser.set(rid, { shows: 0, offersTaken: 0, cash: 0, days: 0 });
  for (const log of logs ?? []) {
    const agg = byUser.get(log.user_id as string);
    if (!agg) continue;
    agg.shows       += log.shows        ?? 0;
    agg.offersTaken += log.offers_taken ?? 0;
    agg.cash        += Number(log.cash_collected ?? 0);
    agg.days        += 1;
  }

  return reps.map((r) => {
    const agg = byUser.get(r.id as string)!;
    return {
      id:             r.id as string,
      name:           (r.full_name as string)?.trim() || (r.email as string)?.split("@")[0] || "Rep",
      username:       r.username as string | null,
      role:           r.role as string | null,
      isVerified:     (r.is_verified as boolean) ?? false,
      bio:            (r.bio as string) || null,
      contactEnabled: (r.contact_enabled as boolean) ?? false,
      totalCash:      agg.cash,
      closeRate:      agg.shows > 0 ? (agg.offersTaken / agg.shows) * 100 : 0,
      daysLogged:     agg.days,
    };
  });
}

export async function getOwnerShortlist(ownerId: string): Promise<Set<string>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("owner_shortlists")
    .select("rep_id")
    .eq("owner_id", ownerId);
  return new Set((data ?? []).map((r) => r.rep_id as string));
}

export async function getOwnerVerificationRequest(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("owner_verification_requests")
    .select("id, full_name, company_name, company_website, offer_description, status, admin_notes, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getPendingOwnerRequests() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("owner_verification_requests")
    .select("id, user_id, full_name, company_name, company_website, offer_description, status, created_at, profiles(email)")
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as Array<{
    id: string;
    user_id: string;
    full_name: string;
    company_name: string;
    company_website: string;
    offer_description: string;
    status: string;
    created_at: string;
    profiles: { email: string } | null;
  }>;
}
