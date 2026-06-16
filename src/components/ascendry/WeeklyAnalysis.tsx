"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Download, TrendingUp, Calendar } from "lucide-react";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { Prospect } from "@/lib/ascendry-queries";

const TEMPLATES = ["A", "B", "C", "D", "E"] as const;

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  return d.toISOString().split("T")[0];
}

function groupByWeek(prospects: Prospect[]) {
  const weeks: Record<string, Prospect[]> = {};
  for (const p of prospects) {
    const ws = getWeekStart(new Date(p.date_messaged));
    if (!weeks[ws]) weeks[ws] = [];
    weeks[ws].push(p);
  }
  return weeks;
}

function templateStats(prospects: Prospect[]) {
  return TEMPLATES.map(t => {
    const tProspects = prospects.filter(p => p.template_used === t);
    const sent = tProspects.length;
    const replied = tProspects.filter(p => p.reply_status !== "No Reply").length;
    const positive = tProspects.filter(p => p.reply_status === "Positive" || p.reply_status === "Call Booked").length;
    const callsBooked = tProspects.filter(p => p.call_booked).length;
    return {
      template: t,
      sent,
      replied,
      positive,
      callsBooked,
      replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
      positiveRate: sent > 0 ? Math.round((positive / sent) * 100) : 0,
    };
  });
}

function downloadCSV(prospects: Prospect[], weekStart: string) {
  const rows = prospects.map(p => [
    p.prospect_name,
    p.instagram_handle ?? "",
    p.date_messaged,
    p.template_used ?? "",
    p.reply_status,
    p.call_booked ? "Yes" : "No",
    (p.notes ?? "").replace(/,/g, ";"),
  ]);

  const headers = ["Name", "Instagram", "Date Messaged", "Template", "Reply Status", "Call Booked", "Notes"];
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `outreach-${weekStart}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function WeeklyAnalysis({ prospects }: { prospects: Prospect[] }) {
  const weeksByDate = useMemo(() => groupByWeek(prospects), [prospects]);
  const sortedWeeks = useMemo(() => Object.keys(weeksByDate).sort((a, b) => b.localeCompare(a)), [weeksByDate]);

  const [selectedWeek, setSelectedWeek] = useState<string>(sortedWeeks[0] ?? "");

  const weekProspects = selectedWeek ? (weeksByDate[selectedWeek] ?? []) : [];
  const stats = useMemo(() => templateStats(weekProspects), [weekProspects]);
  const best = useMemo(() => {
    const withData = stats.filter(s => s.sent > 0);
    if (withData.length === 0) return null;
    return withData.reduce((a, b) => a.replyRate >= b.replyRate ? a : b);
  }, [stats]);

  // Weekly trend: best template per week
  const trendData = useMemo(() => {
    return sortedWeeks
      .slice()
      .reverse()
      .map(ws => {
        const wStats = templateStats(weeksByDate[ws]);
        const b = wStats.filter(s => s.sent > 0).reduce((a, b) => a.replyRate >= b.replyRate ? a : b, { template: "—", replyRate: 0, sent: 0, replied: 0, positive: 0, callsBooked: 0, positiveRate: 0 });
        return {
          week: ws.slice(5), // MM-DD
          winner: `T${b.template}`,
          replyRate: b.replyRate,
          sent: weeksByDate[ws].length,
        };
      });
  }, [sortedWeeks, weeksByDate]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Weekly Analysis</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{sortedWeeks.length} week{sortedWeeks.length !== 1 ? "s" : ""} of data</p>
        </div>
        {selectedWeek && weekProspects.length > 0 && (
          <Button size="sm" variant="secondary" onClick={() => downloadCSV(weekProspects, selectedWeek)}>
            <Download size={13} className="mr-1.5" />
            Export CSV
          </Button>
        )}
      </div>

      {sortedWeeks.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-zinc-500 text-sm text-center py-8">No outreach data yet. Add prospects in the Outreach section.</p>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Week selector */}
          <div className="flex items-center gap-3">
            <Calendar size={15} className="text-zinc-500" />
            <select
              className="input-base w-auto"
              value={selectedWeek}
              onChange={e => setSelectedWeek(e.target.value)}
            >
              {sortedWeeks.map(ws => (
                <option key={ws} value={ws}>
                  Week of {ws} ({weeksByDate[ws].length} sent)
                </option>
              ))}
            </select>
          </div>

          {/* Winner banner */}
          {best && best.sent > 0 && (
            <div className="flex items-center gap-3 px-5 py-4 bg-violet-600/10 border border-violet-600/25 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30 shrink-0">
                <span className="text-base font-bold text-white">{best.template}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={13} className="text-violet-400" />
                  <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">This week's winner</span>
                </div>
                <p className="text-lg font-bold text-white mt-0.5">
                  Template {best.template} — {best.replyRate}% reply rate
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {best.replied} replies from {best.sent} sent · {best.callsBooked} calls booked
                </p>
              </div>
            </div>
          )}

          {/* Template breakdown chart */}
          <Card>
            <CardHeader>
              <CardTitle>Template Performance — Week of {selectedWeek}</CardTitle>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats} barSize={40}>
                  <XAxis dataKey="template" tickFormatter={t => `Template ${t}`} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#111318", border: "1px solid #1e2130", borderRadius: 8, fontSize: 12 }}
                    formatter={(value, name) => [`${value}%`, name === "replyRate" ? "Reply Rate" : "Positive Rate"]}
                  />
                  <Bar dataKey="replyRate" radius={[4, 4, 0, 0]}>
                    {stats.map(s => (
                      <Cell key={s.template} fill={s.template === best?.template ? "#7c3aed" : "#3f3f46"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Stat table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1e2130]">
                      {["Template", "Sent", "Replied", "Reply Rate", "Positive", "Calls Booked"].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-zinc-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map(s => (
                      <tr
                        key={s.template}
                        className={`border-b border-[#1e2130] ${s.template === best?.template ? "bg-violet-600/5" : "hover:bg-zinc-800/20"}`}
                      >
                        <td className="px-3 py-2 font-semibold text-zinc-200 flex items-center gap-2">
                          Template {s.template}
                          {s.template === best?.template && (
                            <span className="text-xs text-violet-400 bg-violet-400/10 border border-violet-400/20 px-1.5 py-0.5 rounded-full">winner</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-zinc-400">{s.sent}</td>
                        <td className="px-3 py-2 text-zinc-400">{s.replied}</td>
                        <td className="px-3 py-2 font-semibold text-zinc-200">{s.replyRate}%</td>
                        <td className="px-3 py-2 text-zinc-400">{s.positive}</td>
                        <td className="px-3 py-2 text-zinc-400">{s.callsBooked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {/* Week-over-week trend */}
          {trendData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Reply Rate Trend</CardTitle>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={trendData} barSize={28}>
                    <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis unit="%" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: "#111318", border: "1px solid #1e2130", borderRadius: 8, fontSize: 11 }}
                      formatter={(value, _name, props) => [
                        `${value}% (${(props as { payload?: { winner?: string } }).payload?.winner ?? ""})`,
                        "Best Template Reply Rate",
                      ]}
                    />
                    <Bar dataKey="replyRate" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
