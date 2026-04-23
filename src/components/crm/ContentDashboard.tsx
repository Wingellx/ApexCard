"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ComposedChart, Line, CartesianGrid, Legend,
} from "recharts";
import type { ContentPost } from "@/lib/crm-queries";

const CONTENT_TYPE_SHORT: Record<string, string> = {
  educational: "Edu", entertaining: "Fun", testimonial: "Test",
  behind_the_scenes: "BTS", offer_promotional: "Promo", pain_point: "Pain",
  authority_credibility: "Auth", trend_reactive: "Trend",
  case_study: "Case", engagement_bait: "Engmt",
};

const tooltipStyle = {
  contentStyle:  { background: "#111318", border: "1px solid #1e2130", borderRadius: 8, fontSize: 12 },
  labelStyle:    { color: "#9ca3af" },
  itemStyle:     { color: "#f0f2f8" },
  cursor:        { fill: "rgba(255,255,255,0.03)" },
};

interface Props {
  posts: ContentPost[];
  weeklyBookings: { week: string; booked: number }[];
}

export default function ContentDashboard({ posts, weeklyBookings }: Props) {
  // Avg score by content type
  const scoreByType = (() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const p of posts) {
      const e = map.get(p.content_type) ?? { sum: 0, count: 0 };
      e.sum   += Number(p.content_score) * 100;
      e.count += 1;
      map.set(p.content_type, e);
    }
    return [...map.entries()]
      .map(([type, { sum, count }]) => ({ type: CONTENT_TYPE_SHORT[type] ?? type, avg: Math.round(sum / count) }))
      .sort((a, b) => b.avg - a.avg);
  })();

  // Weekly volume + avg score
  const weeklyVolume = (() => {
    const map = new Map<string, { count: number; scoreSum: number }>();
    for (const p of posts) {
      const week = weekStart(p.date_posted);
      const e = map.get(week) ?? { count: 0, scoreSum: 0 };
      e.count    += 1;
      e.scoreSum += Number(p.content_score) * 100;
      map.set(week, e);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, { count, scoreSum }]) => ({
        week: week.slice(5), // MM-DD
        posts: count,
        avgScore: Math.round(scoreSum / count),
      }));
  })();

  // Correlation: content posts vs booked calls per week
  const weekMap = new Map(weeklyBookings.map(w => [w.week, w.booked]));
  const correlation = weeklyVolume.map(w => ({
    week:   w.week,
    posts:  w.posts,
    booked: weekMap.get(`20${w.week.length === 5 ? w.week : w.week}`) ?? weeklyBookings.find(b => b.week.slice(5) === w.week)?.booked ?? 0,
  }));

  const hasData = posts.length > 0;

  return (
    <div className="space-y-6">
      {!hasData && (
        <p className="text-xs text-[#4b5563]">Log some content posts to see analytics here.</p>
      )}

      {hasData && (
        <>
          {/* Score by type */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5">
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4">Avg Score by Content Type</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreByType} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#1e2130" vertical={false} />
                <XAxis dataKey="type" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, "Avg Score"]} />
                <Bar dataKey="avg" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly volume + avg score */}
          {weeklyVolume.length > 1 && (
            <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4">Weekly Posts &amp; Avg Score</p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={weeklyVolume} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="#1e2130" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left"  tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
                  <Bar    yAxisId="left"  dataKey="posts"    name="Posts"     fill="#6366f1" radius={[3, 3, 0, 0]} opacity={0.8} />
                  <Line   yAxisId="right" dataKey="avgScore" name="Avg Score %" type="monotone" stroke="#34d399" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Correlation: content vs booked calls */}
          {correlation.length > 1 && weeklyBookings.length > 0 && (
            <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1">Content Posts vs Booked Calls</p>
              <p className="text-[11px] text-[#374151] mb-4">Weekly correlation — do content weeks drive more bookings?</p>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={correlation} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="#1e2130" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left"  tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#4b5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
                  <Line yAxisId="left"  dataKey="posts"  name="Content Posts"  type="monotone" stroke="#6366f1" dot={false} strokeWidth={2} />
                  <Line yAxisId="right" dataKey="booked" name="Booked Calls"   type="monotone" stroke="#f59e0b" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function weekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}
