"use client";

import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, Flame } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FieldStat {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  thisMonth: number;
  lastMonth: number;
  spark: { date: string; value: number }[];
}

interface Props {
  monthLabel: string;
  dateRange: string;
  stats: FieldStat[];
  streak: number;
  totalDaysLogged: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtValue(type: string, n: number): string {
  if (type === "duration") {
    const h = Math.floor(n / 60);
    const m = Math.round(n % 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }
  if (type === "boolean") return `${n}d`;
  if (type === "percent") return `${Math.round(n)}%`;
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(1);
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: { date: string; value: number }[] }) {
  const hasData = data.some(d => d.value > 0);
  if (!hasData) return <div className="h-10 flex items-center justify-center text-[#2a2f45] text-[10px]">No data</div>;

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="#6366f1"
          strokeWidth={1.5}
          fill="url(#sparkGrad)"
          dot={false}
          activeDot={{ r: 3, fill: "#818cf8" }}
        />
        <Tooltip
          content={({ active, payload }) =>
            active && payload?.[0] ? (
              <div className="bg-[#1e2130] border border-[#2a2f45] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f2f8] shadow-lg">
                {payload[0].value as number}
              </div>
            ) : null
          }
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ stat }: { stat: FieldStat }) {
  const pctChange = stat.lastMonth !== 0
    ? ((stat.thisMonth - stat.lastMonth) / Math.abs(stat.lastMonth)) * 100
    : stat.thisMonth > 0 ? 100 : 0;
  const up   = pctChange > 0.5;
  const down = pctChange < -0.5;

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider leading-tight">
          {stat.fieldLabel}
        </p>
        {stat.lastMonth > 0 || stat.thisMonth > 0 ? (
          <span className={`flex items-center gap-1 text-[11px] font-semibold shrink-0
            ${up ? "text-emerald-400" : down ? "text-rose-400" : "text-[#4b5563]"}`}
          >
            {up   && <TrendingUp   className="w-3 h-3" />}
            {down && <TrendingDown className="w-3 h-3" />}
            {!up && !down && <Minus className="w-3 h-3" />}
            {up ? "+" : ""}{pctChange.toFixed(0)}%
          </span>
        ) : null}
      </div>

      <div>
        <p className="text-3xl font-extrabold text-[#f0f2f8] tabular-nums leading-none">
          {fmtValue(stat.fieldType, stat.thisMonth)}
        </p>
        {stat.lastMonth > 0 && (
          <p className="text-[11px] text-[#4b5563] mt-1">
            {fmtValue(stat.fieldType, stat.lastMonth)} last month
          </p>
        )}
      </div>

      <Sparkline data={stat.spark} />
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function CRMStatsView({ monthLabel, dateRange, stats, streak, totalDaysLogged }: Props) {
  const hasStats = stats.some(s => s.thisMonth > 0 || s.lastMonth > 0);

  return (
    <div className="space-y-6">
      {/* Month header */}
      <div>
        <h2 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">{monthLabel}</h2>
        <p className="text-sm text-[#4b5563] mt-0.5">{dateRange}</p>
      </div>

      {!hasStats && stats.length === 0 && (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-10 text-center">
          <p className="text-sm text-[#6b7280]">No CRM fields set up yet.</p>
          <p className="text-xs text-[#4b5563] mt-1">Head to the CRM tab to configure your fields and start logging.</p>
        </div>
      )}

      {stats.length > 0 && !hasStats && (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-10 text-center">
          <p className="text-sm text-[#6b7280]">No logs yet this month.</p>
          <p className="text-xs text-[#4b5563] mt-1">Start logging in the CRM tab to see your stats here.</p>
        </div>
      )}

      {/* Stat cards grid */}
      {hasStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(s => <StatCard key={s.fieldId} stat={s} />)}
        </div>
      )}

      {/* Streak tracker */}
      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 flex items-center gap-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
          ${streak > 0 ? "bg-orange-500/10 border border-orange-500/20" : "bg-[#0d0f15] border border-[#1a1d28]"}`}
        >
          <Flame className={`w-5 h-5 ${streak > 0 ? "text-orange-400" : "text-[#374151]"}`} />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#4b5563] uppercase tracking-wider mb-0.5">Logging Streak</p>
          <p className="text-2xl font-extrabold text-[#f0f2f8]">
            {streak > 0 ? `${streak} day${streak !== 1 ? "s" : ""}` : "No streak yet"}
          </p>
          <p className="text-[11px] text-[#374151] mt-0.5">
            {totalDaysLogged} total day{totalDaysLogged !== 1 ? "s" : ""} logged
          </p>
        </div>
      </div>
    </div>
  );
}
