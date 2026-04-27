import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileFull } from "@/lib/queries";
import {
  getCloserFields, getCloserMonthLogs, getCloserLast30DaysLogs, getCloserAllLogDates,
} from "@/lib/closer-crm-queries";
import type { CrmCustomLog, CrmFieldDef } from "@/lib/closer-crm-queries";
import CRMStatsView, { type FieldStat } from "@/components/crm/CRMStatsView";

// ── Streak ───────────────────────────────────────────────────────────────────

function computeStreak(dates: string[]): number {
  const unique = [...new Set(dates)].sort().reverse();
  if (unique.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(`${unique[i - 1]}T12:00:00`);
    const curr = new Date(`${unique[i]}T12:00:00`);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86_400_000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

// ── Per-field totals ─────────────────────────────────────────────────────────

function sumByField(logs: CrmCustomLog[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const log of logs) {
    if (log.value_number !== null) {
      map.set(log.field_id, (map.get(log.field_id) ?? 0) + log.value_number);
    } else if (log.value_boolean) {
      map.set(log.field_id, (map.get(log.field_id) ?? 0) + 1);
    } else if (log.value_text) {
      map.set(log.field_id, (map.get(log.field_id) ?? 0) + 1);
    }
  }
  return map;
}

// ── Sparkline data per field ─────────────────────────────────────────────────

function buildSparkData(
  logs: CrmCustomLog[],
  fieldId: string
): { date: string; value: number }[] {
  const byDate = new Map<string, number>();
  for (const log of logs) {
    if (log.field_id !== fieldId) continue;
    const val = log.value_number ?? (log.value_boolean ? 1 : 0);
    byDate.set(log.log_date, (byDate.get(log.log_date) ?? 0) + val);
  }

  // Build last 30 days scaffold so every day is represented
  const result: { date: string; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const iso = d.toISOString().split("T")[0];
    result.push({ date: iso, value: byDate.get(iso) ?? 0 });
  }
  return result;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CRMStatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await getProfileFull(user.id);
  if (!profile) redirect("/onboarding");

  const now       = new Date();
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
  const lastYear  = thisMonth === 1 ? thisYear - 1 : thisYear;

  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay   = `${thisYear}-${String(thisMonth).padStart(2, "0")}-01`;
  const today      = now.toISOString().split("T")[0];
  const dateRange  = `${new Date(`${firstDay}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(`${today}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  // Load closer fields + all log data in parallel
  const [fields, thisMonthLogs, lastMonthLogs, last30Logs, allLogDates] = await Promise.all([
    getCloserFields(user.id),
    getCloserMonthLogs(user.id, thisYear, thisMonth),
    getCloserMonthLogs(user.id, lastYear, lastMonth),
    getCloserLast30DaysLogs(user.id),
    getCloserAllLogDates(user.id),
  ]);

  const activeFields: CrmFieldDef[] = fields.filter(f => f.is_active);
  const thisMonthTotals = sumByField(thisMonthLogs);
  const lastMonthTotals = sumByField(lastMonthLogs);

  const stats: FieldStat[] = activeFields.map(f => ({
    fieldId:    f.id,
    fieldLabel: f.field_label,
    fieldType:  f.field_type,
    thisMonth:  thisMonthTotals.get(f.id) ?? 0,
    lastMonth:  lastMonthTotals.get(f.id) ?? 0,
    spark:      buildSparkData(last30Logs, f.id),
  }));

  const streak        = computeStreak(allLogDates);
  const totalDaysLogged = new Set(allLogDates).size;

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px]">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">CRM Stats</h1>
        <p className="text-sm text-[#6b7280] mt-0.5">Your performance from your daily CRM logs.</p>
      </div>

      <CRMStatsView
        monthLabel={monthLabel}
        dateRange={dateRange}
        stats={stats}
        streak={streak}
        totalDaysLogged={totalDaysLogged}
      />
    </div>
  );
}
