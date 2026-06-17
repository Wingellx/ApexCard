"use client";

import { useState, useMemo, useTransition } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChevronDown, ChevronUp, Trash2, Check } from "lucide-react";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { upsertClientMetric, deleteClientMetric } from "@/app/ascendry/actions";
import type { AscendryClient, ClientMetric, AscendryUser } from "@/lib/ascendry-queries";

const USER_COLORS = ["#7c3aed", "#10b981"] as const;

function weekStart(offset = 0): string {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7) + offset * 7);
  return monday.toISOString().split("T")[0];
}

const WEEK_OPTIONS = [
  { label: "This week",   value: weekStart(0)  },
  { label: "Last week",   value: weekStart(-1) },
  { label: "2 weeks ago", value: weekStart(-2) },
  { label: "3 weeks ago", value: weekStart(-3) },
];

type ViewMode = "combined" | string; // string = user_id

interface MetricFormState {
  calls_booked: string;
  calls_taken: string;
  show_rate_pct: string;
  close_rate_pct: string;
  revenue_generated: string;
  week_starting: string;
}

const DEFAULT_METRIC: MetricFormState = {
  calls_booked: "",
  calls_taken: "",
  show_rate_pct: "",
  close_rate_pct: "",
  revenue_generated: "",
  week_starting: weekStart(0),
};

function combinedMetrics(metrics: ClientMetric[]): ClientMetric {
  return {
    id: "combined",
    client_id: metrics[0]?.client_id ?? "",
    week_starting: metrics[0]?.week_starting ?? "",
    calls_booked: metrics.reduce((s, m) => s + m.calls_booked, 0),
    calls_taken: metrics.reduce((s, m) => s + m.calls_taken, 0),
    show_rate_pct: null,
    close_rate_pct: null,
    revenue_generated: metrics.reduce((s, m) => s + m.revenue_generated, 0),
    logged_by: null,
    created_at: "",
  } as ClientMetric;
}

interface ClientPanelProps {
  client: AscendryClient;
  metrics: ClientMetric[];
  isAdmin: boolean;
  currentUserId: string;
  ascendryUsers: AscendryUser[];
  onSave: (data: Parameters<typeof upsertClientMetric>[0]) => void;
  onDelete: (id: string) => void;
}

function ClientPanel({ client, metrics, isAdmin, currentUserId, ascendryUsers, onSave, onDelete }: ClientPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<MetricFormState>(DEFAULT_METRIC);
  const [view, setView] = useState<ViewMode>("combined");
  const [isPending, startTransition] = useTransition();

  const userMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of ascendryUsers) m[u.user_id] = u.display_name;
    return m;
  }, [ascendryUsers]);

  const clientMetrics = useMemo(
    () => metrics.filter(m => m.client_id === client.id),
    [metrics, client.id]
  );

  // Group by week, then by user within each week
  const weekMap = useMemo(() => {
    const map: Record<string, ClientMetric[]> = {};
    for (const m of clientMetrics) {
      if (!map[m.week_starting]) map[m.week_starting] = [];
      map[m.week_starting].push(m);
    }
    return map;
  }, [clientMetrics]);

  const sortedWeeks = useMemo(
    () => Object.keys(weekMap).sort((a, b) => a.localeCompare(b)),
    [weekMap]
  );

  // Filtered metrics by view
  const filteredMetrics = useMemo(() => {
    if (view === "combined") return clientMetrics;
    return clientMetrics.filter(m => m.logged_by === view);
  }, [clientMetrics, view]);

  // Totals for the current view
  const totals = useMemo(() => ({
    calls_booked: filteredMetrics.reduce((s, m) => s + m.calls_booked, 0),
    calls_taken: filteredMetrics.reduce((s, m) => s + m.calls_taken, 0),
    revenue: filteredMetrics.reduce((s, m) => s + m.revenue_generated, 0),
  }), [filteredMetrics]);

  // Per-user totals for the summary strip
  const perUserTotals = useMemo(() => {
    return ascendryUsers.map(u => {
      const userMetrics = clientMetrics.filter(m => m.logged_by === u.user_id);
      return {
        user_id: u.user_id,
        name: u.display_name,
        calls_taken: userMetrics.reduce((s, m) => s + m.calls_taken, 0),
        revenue: userMetrics.reduce((s, m) => s + m.revenue_generated, 0),
        weeks: userMetrics.length,
      };
    });
  }, [clientMetrics, ascendryUsers]);

  // Chart data — one point per week, one series per user + combined
  const chartData = useMemo(() => {
    return sortedWeeks.map(ws => {
      const weekMetrics = weekMap[ws];
      const point: Record<string, number | string> = { week: ws.slice(5) };
      for (const u of ascendryUsers) {
        const um = weekMetrics.find(m => m.logged_by === u.user_id);
        point[`revenue_${u.user_id}`] = um?.revenue_generated ?? 0;
        point[`close_${u.user_id}`] = um?.close_rate_pct ?? 0;
      }
      point["revenue_combined"] = weekMetrics.reduce((s, m) => s + m.revenue_generated, 0);
      return point;
    });
  }, [sortedWeeks, weekMap, ascendryUsers]);

  function handleSubmit() {
    onSave({
      client_id: client.id,
      week_starting: form.week_starting,
      calls_booked: Number(form.calls_booked) || 0,
      calls_taken: Number(form.calls_taken) || 0,
      show_rate_pct: form.show_rate_pct ? Number(form.show_rate_pct) : null,
      close_rate_pct: form.close_rate_pct ? Number(form.close_rate_pct) : null,
      revenue_generated: Number(form.revenue_generated) || 0,
    });
    setForm(DEFAULT_METRIC);
  }

  return (
    <Card>
      <button className="w-full" onClick={() => setExpanded(v => !v)}>
        <CardHeader className="cursor-pointer hover:bg-zinc-800/20 transition-colors rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
              <span className="text-xs font-bold text-violet-300">{client.name[0]}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-zinc-100">{client.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {sortedWeeks.length} week{sortedWeeks.length !== 1 ? "s" : ""} · £{clientMetrics.reduce((s, m) => s + m.revenue_generated, 0).toLocaleString("en-GB")} combined
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Per-user mini badges */}
            <div className="hidden sm:flex gap-3">
              {perUserTotals.map((u, i) => (
                <div key={u.user_id} className="text-right">
                  <p className="text-xs font-medium" style={{ color: USER_COLORS[i % USER_COLORS.length] }}>{u.name}</p>
                  <p className="text-xs text-zinc-400">£{u.revenue.toLocaleString("en-GB")}</p>
                </div>
              ))}
            </div>
            {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
          </div>
        </CardHeader>
      </button>

      {expanded && (
        <CardBody className="space-y-6">
          {/* View toggle */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: "combined", label: "Combined" },
              ...ascendryUsers.map(u => ({ id: u.user_id, label: u.display_name })),
            ].map((opt, i) => (
              <button
                key={opt.id}
                onClick={() => setView(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  view === opt.id
                    ? "text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
                style={view === opt.id ? {
                  background: opt.id === "combined" ? "#7c3aed" : USER_COLORS[(i - 1) % USER_COLORS.length],
                } : undefined}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Accountability strip — always visible */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {perUserTotals.map((u, i) => (
              <div
                key={u.user_id}
                className="bg-[#0a0b0f] border border-[#1e2130] rounded-xl p-3"
                style={{ borderColor: `${USER_COLORS[i % USER_COLORS.length]}30` }}
              >
                <p className="text-xs font-medium mb-2" style={{ color: USER_COLORS[i % USER_COLORS.length] }}>
                  {u.name}
                </p>
                <p className="text-lg font-bold text-white">£{u.revenue.toLocaleString("en-GB")}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{u.calls_taken} calls · {u.weeks} weeks logged</p>
              </div>
            ))}
            <div className="bg-[#0a0b0f] border border-violet-600/20 rounded-xl p-3 sm:col-span-2">
              <p className="text-xs font-medium text-violet-400 mb-2">Combined</p>
              <p className="text-lg font-bold text-white">
                £{clientMetrics.reduce((s, m) => s + m.revenue_generated, 0).toLocaleString("en-GB")}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {clientMetrics.reduce((s, m) => s + m.calls_taken, 0)} calls total
              </p>
            </div>
          </div>

          {/* Log weekly data */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Log Your Week</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Week</label>
                <select className="input-base w-full text-xs" value={form.week_starting} onChange={e => setForm(f => ({ ...f, week_starting: e.target.value }))}>
                  {WEEK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {[
                { key: "calls_booked",      label: "Calls Booked" },
                { key: "calls_taken",       label: "Calls Taken"  },
                { key: "show_rate_pct",     label: "Show Rate %"  },
                { key: "close_rate_pct",    label: "Close Rate %" },
                { key: "revenue_generated", label: "Revenue £"    },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-zinc-500 mb-1">{f.label}</label>
                  <input
                    type="number"
                    min="0"
                    className="input-base w-full text-xs"
                    value={(form as unknown as Record<string, string>)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <Button size="sm" className="mt-3" onClick={handleSubmit} loading={isPending}>
              <Check size={13} className="mr-1.5" />
              Save Week
            </Button>
          </div>

          {/* Charts */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 mb-2">Revenue per week (£)</p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#111318", border: "1px solid #1e2130", borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {ascendryUsers.map((u, i) => (
                      <Line
                        key={u.user_id}
                        type="monotone"
                        dataKey={`revenue_${u.user_id}`}
                        name={u.display_name}
                        stroke={USER_COLORS[i % USER_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                    <Line type="monotone" dataKey="revenue_combined" name="Combined" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 2" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-2">Close Rate per week (%)</p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis unit="%" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "#111318", border: "1px solid #1e2130", borderRadius: 8, fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    {ascendryUsers.map((u, i) => (
                      <Line
                        key={u.user_id}
                        type="monotone"
                        dataKey={`close_${u.user_id}`}
                        name={u.display_name}
                        stroke={USER_COLORS[i % USER_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Weekly log table */}
          {sortedWeeks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Weekly Log</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1e2130]">
                      {["Week", "Who", "Calls Booked", "Calls Taken", "Show %", "Close %", "Revenue", ""].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-zinc-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...sortedWeeks].reverse().flatMap(ws => {
                      const weekMetrics = weekMap[ws];
                      const rows = view === "combined"
                        ? weekMetrics
                        : weekMetrics.filter(m => m.logged_by === view);

                      return rows.map((m, idx) => (
                        <tr key={m.id} className="border-b border-[#1e2130] hover:bg-zinc-800/20">
                          <td className="px-3 py-2 text-zinc-300 font-medium">{idx === 0 ? ws : ""}</td>
                          <td className="px-3 py-2">
                            {m.logged_by && userMap[m.logged_by] ? (
                              <span
                                className="text-xs font-medium px-1.5 py-0.5 rounded"
                                style={{
                                  color: USER_COLORS[ascendryUsers.findIndex(u => u.user_id === m.logged_by) % USER_COLORS.length],
                                  background: `${USER_COLORS[ascendryUsers.findIndex(u => u.user_id === m.logged_by) % USER_COLORS.length]}15`,
                                }}
                              >
                                {userMap[m.logged_by]}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-3 py-2 text-zinc-400">{m.calls_booked}</td>
                          <td className="px-3 py-2 text-zinc-400">{m.calls_taken}</td>
                          <td className="px-3 py-2 text-zinc-400">{m.show_rate_pct != null ? `${m.show_rate_pct}%` : "—"}</td>
                          <td className="px-3 py-2 text-zinc-400">{m.close_rate_pct != null ? `${m.close_rate_pct}%` : "—"}</td>
                          <td className="px-3 py-2 text-emerald-400 font-medium">£{m.revenue_generated.toLocaleString("en-GB")}</td>
                          <td className="px-3 py-2">
                            {isAdmin && (
                              <button onClick={() => onDelete(m.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                <Trash2 size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardBody>
      )}
    </Card>
  );
}

interface Props {
  clients: AscendryClient[];
  allMetrics: ClientMetric[];
  isAdmin: boolean;
  currentUserId: string;
  ascendryUsers: AscendryUser[];
}

export default function ClientMetricsDashboard({ clients, allMetrics, isAdmin, currentUserId, ascendryUsers }: Props) {
  const [metrics, setMetrics] = useState<ClientMetric[]>(allMetrics);
  const [isPending, startTransition] = useTransition();

  function handleSave(data: Parameters<typeof upsertClientMetric>[0]) {
    setMetrics(prev => {
      const existing = prev.findIndex(
        m => m.client_id === data.client_id && m.week_starting === data.week_starting && m.logged_by === currentUserId
      );
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], ...data, logged_by: currentUserId };
        return updated;
      }
      return [...prev, {
        id: crypto.randomUUID(),
        ...data,
        logged_by: currentUserId,
        created_at: new Date().toISOString(),
      } as ClientMetric];
    });
    startTransition(async () => {
      try { await upsertClientMetric(data); } catch {}
    });
  }

  function handleDelete(id: string) {
    setMetrics(prev => prev.filter(m => m.id !== id));
    startTransition(async () => {
      try { await deleteClientMetric(id); } catch {}
    });
  }

  const totalRevenue = metrics.reduce((s, m) => s + m.revenue_generated, 0);
  const totalCalls = metrics.reduce((s, m) => s + m.calls_taken, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Client Metrics</h1>
        <p className="text-sm text-zinc-500 mt-0.5">{clients.length} active client{clients.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Overall summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="px-5 py-4">
          <p className="text-xs text-zinc-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-white">£{totalRevenue.toLocaleString("en-GB")}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-xs text-zinc-500 mb-1">Total Calls Taken</p>
          <p className="text-2xl font-bold text-white">{totalCalls}</p>
        </Card>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-zinc-500 text-sm text-center py-6">
              No active clients yet. Move clients to "Active Client" in the Pipeline.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {clients.map(client => (
            <ClientPanel
              key={client.id}
              client={client}
              metrics={metrics}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              ascendryUsers={ascendryUsers}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
