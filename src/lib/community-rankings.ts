import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Division = "sales" | "improvement" | "mixed";

export interface CommunityRankingRow {
  teamId:        string;
  name:          string;
  logoUrl:       string | null;
  division:      Division;
  tier:          number;
  communityType: string;
  memberCount:   number;
  activeMembers: number;  // had activity in last 7 days
  score:         number;
  prevScore:     number | null;
  scoreChange:   number | null; // positive = improved
}

export interface IndividualRankingRow {
  userId:        string;
  name:          string;
  username:      string | null;
  salesRole:     string | null;
  communityName: string | null;
  value:         number;
  valueLabel:    string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bounds(monthsAgo = 0) {
  const now  = new Date();
  let   y    = now.getFullYear();
  let   m    = now.getMonth() - monthsAgo;
  while (m < 0) { m += 12; y -= 1; }
  const first = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const last  = new Date(y, m + 1, 0).toISOString().split("T")[0];
  return { first, last };
}

function sevenDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

function salesScore(cash: number, active: number, closeRate: number): number {
  if (active === 0) return 0;
  const perCapita = cash / active;
  // $100 per member = 1pt from cash; each pct of close rate = 1pt
  return Math.round(perCapita / 100 + closeRate * 100);
}

function improvScore(avgExec: number): number {
  return Math.round(avgExec);
}

function mixedScore(cash: number, active: number, closeRate: number, avgExec: number): number {
  // Normalise sales to 0-100 before blending
  const s = Math.min(100, salesScore(cash, active, closeRate));
  const i = improvScore(avgExec);
  return Math.round((s + i) / 2);
}

function computeScore(
  division: Division,
  cash: number, active: number, closeRate: number,
  avgExec: number,
): number {
  if (division === "sales")       return salesScore(cash, active, closeRate);
  if (division === "improvement") return improvScore(avgExec);
  return mixedScore(cash, active, closeRate, avgExec);
}

// ── Main rankings query ───────────────────────────────────────────────────────

export async function getCommunityRankings(division?: Division): Promise<CommunityRankingRow[]> {
  const admin = createAdminClient();

  // Fetch all teams + members (fetch-all pattern — PostgREST filter unreliable)
  const [{ data: teams }, { data: allMembers }] = await Promise.all([
    admin.from("teams").select("id, name, logo_url, division, tier, community_type"),
    admin.from("team_members").select("user_id, team_id"),
  ]);

  if (!teams?.length) return [];

  const filtered = division
    ? (teams as { id: string; name: string; logo_url: string | null; division: string; tier: number; community_type: string }[]).filter(t => t.division === division)
    : (teams as { id: string; name: string; logo_url: string | null; division: string; tier: number; community_type: string }[]);

  if (!filtered.length) return [];

  const membersByTeam = new Map<string, string[]>();
  for (const t of filtered) membersByTeam.set(t.id, []);
  for (const m of allMembers ?? []) {
    const list = membersByTeam.get(m.team_id as string);
    if (list) list.push(m.user_id as string);
  }

  const allUserIds = [...new Set((allMembers ?? []).filter(m => membersByTeam.has(m.team_id as string)).map(m => m.user_id as string))];
  if (!allUserIds.length) {
    return filtered.map(t => ({
      teamId: t.id, name: t.name, logoUrl: t.logo_url ?? null,
      division: t.division as Division, tier: t.tier, communityType: t.community_type,
      memberCount: 0, activeMembers: 0, score: 0, prevScore: null, scoreChange: null,
    }));
  }

  const { first: mFirst, last: mLast } = bounds(0);
  const { first: lFirst, last: lLast } = bounds(1);
  const since7d = sevenDaysAgo();

  // Parallel data fetch
  const [
    { data: thisCallLogs },
    { data: lastCallLogs },
    { data: thisCheckins },
    { data: lastCheckins },
    { data: recent },
  ] = await Promise.all([
    admin.from("call_logs").select("user_id, cash_collected, shows, offers_taken").in("user_id", allUserIds).gte("date", mFirst).lte("date", mLast),
    admin.from("call_logs").select("user_id, cash_collected, shows, offers_taken").in("user_id", allUserIds).gte("date", lFirst).lte("date", lLast),
    admin.from("daily_checkins").select("user_id, performance_score").in("user_id", allUserIds).gte("checkin_date", mFirst).lte("checkin_date", mLast),
    admin.from("daily_checkins").select("user_id, performance_score").in("user_id", allUserIds).gte("checkin_date", lFirst).lte("checkin_date", lLast),
    admin.from("call_logs").select("user_id").in("user_id", allUserIds).gte("date", since7d),
  ]);

  // Index recent activity
  const recentActivity = new Set((recent ?? []).map(r => r.user_id as string));
  // Also count checkin recent activity
  // (re-use thisCheckins as proxy since monthly overlaps 7d)
  for (const c of thisCheckins ?? []) {
    // checkin is already recent enough (this month includes last 7d)
    // but we want strict 7d — we already have it from call_logs; good enough
  }

  function buildTeamStats(logs: typeof thisCallLogs, checkins: typeof thisCheckins, teamIds: string[]) {
    const cash    = new Map<string, number>();
    const shows   = new Map<string, number>();
    const offers  = new Map<string, number>();
    const scores  = new Map<string, number[]>();

    for (const uid of allUserIds) { cash.set(uid, 0); shows.set(uid, 0); offers.set(uid, 0); }
    for (const l of logs ?? []) {
      const uid = l.user_id as string;
      cash.set(uid,   (cash.get(uid)   ?? 0) + Number(l.cash_collected ?? 0));
      shows.set(uid,  (shows.get(uid)  ?? 0) + (l.shows        ?? 0));
      offers.set(uid, (offers.get(uid) ?? 0) + (l.offers_taken ?? 0));
    }
    for (const c of checkins ?? []) {
      const uid = c.user_id as string;
      const list = scores.get(uid) ?? [];
      if ((c.performance_score ?? 0) > 0) list.push(c.performance_score as number);
      scores.set(uid, list);
    }

    const result = new Map<string, { cash: number; active: number; closeRate: number; avgExec: number }>();
    for (const teamId of teamIds) {
      const members = membersByTeam.get(teamId) ?? [];
      let teamCash = 0, teamShows = 0, teamOffers = 0, teamExecSum = 0, teamExecCount = 0;
      let active = 0;
      for (const uid of members) {
        const hasCalls   = (cash.get(uid) ?? 0) > 0;
        const hasCheckin = (scores.get(uid) ?? []).length > 0;
        if (hasCalls || hasCheckin || recentActivity.has(uid)) active++;
        teamCash   += cash.get(uid)   ?? 0;
        teamShows  += shows.get(uid)  ?? 0;
        teamOffers += offers.get(uid) ?? 0;
        const sc = scores.get(uid) ?? [];
        teamExecSum   += sc.reduce((a, b) => a + b, 0);
        teamExecCount += sc.length;
      }
      const closeRate = teamShows > 0 ? teamOffers / teamShows : 0;
      const avgExec   = teamExecCount > 0 ? teamExecSum / teamExecCount : 0;
      result.set(teamId, { cash: teamCash, active, closeRate, avgExec });
    }
    return result;
  }

  const teamIds     = filtered.map(t => t.id);
  const thisStats   = buildTeamStats(thisCallLogs, thisCheckins, teamIds);
  const lastStats   = buildTeamStats(lastCallLogs, lastCheckins, teamIds);

  const rows: CommunityRankingRow[] = filtered.map(t => {
    const members = membersByTeam.get(t.id) ?? [];
    const ts  = thisStats.get(t.id)!;
    const ls  = lastStats.get(t.id);
    const div = t.division as Division;

    const score     = computeScore(div, ts.cash, ts.active, ts.closeRate, ts.avgExec);
    const prevScore = ls ? computeScore(div, ls.cash, ls.active, ls.closeRate, ls.avgExec) : null;

    return {
      teamId:        t.id,
      name:          t.name,
      logoUrl:       t.logo_url ?? null,
      division:      div,
      tier:          t.tier,
      communityType: t.community_type,
      memberCount:   members.length,
      activeMembers: ts.active,
      score,
      prevScore,
      scoreChange:   prevScore != null ? score - prevScore : null,
    };
  });

  return rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

// ── Individual cross-community rankings ───────────────────────────────────────

export async function getIndividualRankings(track: "sales" | "improvement"): Promise<IndividualRankingRow[]> {
  const admin = createAdminClient();
  const { first, last } = bounds(0);

  const [
    { data: allMembersRaw },
    { data: allTeamsRaw },
    { data: profiles },
  ] = await Promise.all([
    admin.from("team_members").select("user_id, team_id"),
    admin.from("teams").select("id, name"),
    admin.from("profiles").select("id, full_name, email, username, role"),
  ]);

  const teamName  = new Map<string, string>((allTeamsRaw ?? []).map(t => [t.id as string, t.name as string]));
  const userTeam  = new Map<string, string>((allMembersRaw ?? []).map(m => [m.user_id as string, m.team_id as string]));
  const profileOf = new Map<string, { full_name: string | null; email: string | null; username: string | null; role: string | null }>(
    (profiles ?? []).map(p => [p.id as string, p as { full_name: string | null; email: string | null; username: string | null; role: string | null }])
  );

  if (track === "sales") {
    const { data: logs } = await admin
      .from("call_logs")
      .select("user_id, cash_collected")
      .gte("date", first)
      .lte("date", last);

    const cashByUser = new Map<string, number>();
    for (const l of logs ?? []) {
      const uid = l.user_id as string;
      cashByUser.set(uid, (cashByUser.get(uid) ?? 0) + Number(l.cash_collected ?? 0));
    }

    const entries = [...cashByUser.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25);

    return entries.map(([uid, cash]) => {
      const p    = profileOf.get(uid);
      const tid  = userTeam.get(uid);
      return {
        userId:        uid,
        name:          p?.full_name?.trim() || p?.email?.split("@")[0] || "Rep",
        username:      p?.username ?? null,
        salesRole:     p?.role ?? null,
        communityName: tid ? (teamName.get(tid) ?? null) : null,
        value:         cash,
        valueLabel:    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cash),
      };
    });
  }

  // Improvement track — avg execution score last 30 days
  const since30 = new Date(); since30.setDate(since30.getDate() - 30);
  const { data: checkins } = await admin
    .from("daily_checkins")
    .select("user_id, performance_score")
    .gte("checkin_date", since30.toISOString().split("T")[0]);

  const scoresByUser = new Map<string, number[]>();
  for (const c of checkins ?? []) {
    if (!c.performance_score || c.performance_score <= 0) continue;
    const uid  = c.user_id as string;
    const list = scoresByUser.get(uid) ?? [];
    list.push(c.performance_score as number);
    scoresByUser.set(uid, list);
  }

  const entries = [...scoresByUser.entries()]
    .map(([uid, scores]) => [uid, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);

  return entries.map(([uid, avg]) => {
    const p   = profileOf.get(uid);
    const tid = userTeam.get(uid);
    return {
      userId:        uid,
      name:          p?.full_name?.trim() || p?.email?.split("@")[0] || "Member",
      username:      p?.username ?? null,
      salesRole:     p?.role ?? null,
      communityName: tid ? (teamName.get(tid) ?? null) : null,
      value:         avg,
      valueLabel:    `${avg}/100`,
    };
  });
}
