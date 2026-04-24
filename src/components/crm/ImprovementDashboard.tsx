"use client";

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend,
} from "recharts";
import { Target, Zap, TrendingUp } from "lucide-react";
import type { ImprovementMetric } from "@/lib/call-analysis-queries";

interface Props {
  metrics: ImprovementMetric[];
  focusAreas: string[];
  objections: {
    thisMonth: { type: string; count: number }[];
    lastMonth: { type: string; count: number }[];
  };
}

const tooltipStyle = {
  contentStyle: { background: "#111318", border: "1px solid #1e2130", borderRadius: 8, fontSize: 12 },
  labelStyle:   { color: "#9ca3af" },
  itemStyle:    { color: "#f0f2f8" },
  cursor:       { fill: "rgba(255,255,255,0.03)" },
};

export default function ImprovementDashboard({ metrics, focusAreas, objections }: Props) {
  const latest = metrics.at(-1);

  // Format for charts — numbers must be JS numbers (not Postgres strings)
  const chartData = metrics.map(m => ({
    label:             new Date(m.month + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    improvement_score: Number(m.improvement_score),
    close_rate:        Number(m.close_rate),
    avg_handle_rate:   Number(m.avg_handle_rate),
  }));

  // Most common focus area across last N calls
  const focusCount = new Map<string, number>();
  for (const f of focusAreas) focusCount.set(f, (focusCount.get(f) ?? 0) + 1);
  const topFocus = [...focusCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Grouped bar data for objection comparison
  const allTypes = [...new Set([
    ...objections.thisMonth.map(o => o.type),
    ...objections.lastMonth.map(o => o.type),
  ])];
  const barData = allTypes.map(type => ({
    type:        type.length > 18 ? type.slice(0, 16) + "…" : type,
    "This Month": objections.thisMonth.find(o => o.type === type)?.count ?? 0,
    "Last Month": objections.lastMonth.find(o => o.type === type)?.count ?? 0,
  }));

  if (metrics.length === 0) {
    return (
      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center">
        <TrendingUp className="w-8 h-8 text-[#374151] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#f0f2f8] mb-1">No coaching data yet</p>
        <p className="text-sm text-[#6b7280]">Analyse a call to generate your first coaching metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Latest snapshot cards */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Improvement Score", value: `${Number(latest.improvement_score).toFixed(1)}/100`, color: "text-indigo-300" },
            { label: "Close Rate",        value: `${Number(latest.close_rate).toFixed(1)}%`,           color: "text-emerald-400" },
            { label: "Handle Rate",       value: `${Number(latest.avg_handle_rate).toFixed(1)}%`,      color: "text-amber-400"  },
            { label: "Calls Analysed",    value: String(latest.calls_analysed),                        color: "text-[#f0f2f8]"  },
          ].map(c => (
            <div key={c.label} className="bg-[#111318] border border-[#1e2130] rounded-xl px-4 py-3">
              <p className="text-[11px] text-[#4b5563] uppercase tracking-wider mb-1">{c.label}</p>
              <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Focus for this month */}
      {topFocus && (
        <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-indigo-400" />
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              Focus for This Month
            </p>
          </div>
          <p className="text-sm text-[#e5e7eb] leading-relaxed">{topFocus}</p>
          <p className="text-[11px] text-indigo-400/40 mt-1.5">
            Recurring theme across your last {focusAreas.length} analysed call{focusAreas.length !== 1 ? "s" : ""}.
          </p>
        </div>
      )}

      {/* Top weakness + strength */}
      {latest && (latest.top_weakness || latest.top_strength) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {latest.top_weakness && (
            <div className="bg-rose-500/[0.04] border border-rose-500/15 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-rose-400" />
                <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Top Weakness</p>
              </div>
              <p className="text-sm text-[#9ca3af] leading-relaxed">{latest.top_weakness}</p>
            </div>
          )}
          {latest.top_strength && (
            <div className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Top Strength</p>
              </div>
              <p className="text-sm text-[#9ca3af] leading-relaxed">{latest.top_strength}</p>
            </div>
          )}
        </div>
      )}

      {/* Trend charts — only shown with 2+ months of data */}
      {chartData.length > 1 && (
        <>
          {/* Improvement score trend */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5">
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4">
              Improvement Score Trend
            </p>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="#1e2130" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [v, "Score"]} />
                  <Line dataKey="improvement_score" name="Score" type="monotone" stroke="#6366f1" dot={{ r: 3, fill: "#6366f1" }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Close rate + handle rate */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5">
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4">
              Close Rate &amp; Objection Handle Rate
            </p>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="#1e2130" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} formatter={(v, name) => [`${v}%`, name]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
                  <Line dataKey="close_rate"      name="Close Rate %"  type="monotone" stroke="#34d399" dot={{ r: 3, fill: "#34d399" }} strokeWidth={2} />
                  <Line dataKey="avg_handle_rate" name="Handle Rate %"  type="monotone" stroke="#f59e0b" dot={{ r: 3, fill: "#f59e0b" }} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Objection comparison bar chart */}
      {barData.length > 0 && (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4">
            Top Objections — This Month vs Last
          </p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#1e2130" vertical={false} />
                <XAxis dataKey="type" tick={{ fill: "#4b5563", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
                <Bar dataKey="This Month" fill="#6366f1" radius={[3, 3, 0, 0]} opacity={0.9} />
                <Bar dataKey="Last Month" fill="#374151" radius={[3, 3, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
