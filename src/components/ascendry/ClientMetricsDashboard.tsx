"use client";

import { useState, useMemo, useTransition } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Plus, ChevronDown, ChevronUp, Trash2, Check } from "lucide-react";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { upsertClientMetric, deleteClientMetric } from "@/app/ascendry/actions";
import type { AscendryClient, ClientMetric } from "@/lib/ascendry-queries";

function weekStart(offset = 0): string {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7) + offset * 7);
  return monday.toISOString().split("T")[0];
}

const WEEK_OPTIONS = [
  { label: "This week",  value: weekStart(0) },
  { label: "Last week",  value: weekStart(-1) },
  { label: "2 weeks ago", value: weekStart(-2) },
  { label: "3 weeks ago", value: weekStart(-3) },
];

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

interface ClientPanelProps {
  client: AscendryClient;
  metrics: ClientMetric[];
  isAdmin: boolean;
  onSave: (data: { client_id: string; week_starting: string; calls_booked: number; calls_taken: number; show_rate_pct: number | null; close_rate_pct: number | null; revenue_generated: number }) => void;
  onDelete: (id: string) => void;
}

function ClientPanel({ client, metrics, isAdmin, onSave, onDelete }: ClientPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState<MetricFormState>(DEFAULT_METRIC);
  const [isPending, startTransition] = useTransition();

  const clientMetrics = useMemo(
    () => metrics
      .filter(m => m.client_id === client.id)
      .sort((a, b) => a.week_starting.localeCompare(b.week_starting)),
    [metrics, client.id]
  );

  const totals = useMemo(() => ({
    calls_booked: clientMetrics.reduce((s, m) => s + m.calls_booked, 0),
    calls_taken: clientMetrics.reduce((s, m) => s + m.calls_taken, 0),
    revenue: clientMetrics.reduce((s, m) => s + m.revenue_generated, 0),
  }), [clientMetrics]);

  const avgShowRate = useMemo(() => {
    const rated = clientMetrics.filter(m => m.show_rate_pct != null);
    return rated.length > 0 ? (rated.reduce((s, m) => s + (m.show_rate_pct ?? 0), 0) / rated.length) : null;
  }, [clientMetrics]);

  const avgCloseRate = useMemo(() => {
    const rated = clientMetrics.filter(m => m.close_rate_pct != null);
    return rated.length > 0 ? (rated.reduce((s, m) => s + (m.close_rate_pct ?? 0), 0) / rated.length) : null;
  }, [clientMetrics]);

  const chartData = clientMetrics.map(m => ({
    week: m.week_starting.slice(5), // MM-DD
    revenue: m.revenue_generated,
    calls_taken: m.calls_taken,
    show_rate: m.show_rate_pct ?? 0,
    close_rate: m.close_rate_pct ?? 0,
  }));

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
      <button
        className="w-full"
        onClick={() => setExpanded(v => !v)}
      >
        <CardHeader className="cursor-pointer hover:bg-zinc-800/20 transition-colors rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
              <span className="text-xs font-bold text-violet-300">{client.name[0]}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-zinc-100">{client.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {clientMetrics.length} week{clientMetrics.length !== 1 ? "s" : ""} · £{totals.revenue.toLocaleString("en-GB")} total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-4 text-right">
              {[
                { label: "Calls Taken",  value: totals.calls_taken.toString() },
                { label: "Avg Show",     value: avgShowRate != null ? `${avgShowRate.toFixed(0)}%` : "—" },
                { label: "Avg Close",    value: avgCloseRate != null ? `${avgCloseRate.toFixed(0)}%` : "—" },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                  <p className="text-sm font-semibold text-zinc-100">{stat.value}</p>
                </div>
              ))}
            </div>
            {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
          </div>
        </CardHeader>
      </button>

      {expanded && (
        <CardBody className="space-y-6">
          {/* Log new week */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Log Weekly Data</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Week</label>
                <select
                  className="input-base w-full text-xs"
                  value={form.week_starting}
                  onChange={e => setForm(f => ({ ...f, week_starting: e.target.value }))}
                >
                  {WEEK_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {[
                { key: "calls_booked",      label: "Calls Booked",  type: "number" },
                { key: "calls_taken",       label: "Calls Taken",   type: "number" },
                { key: "show_rate_pct",     label: "Show Rate %",   type: "number" },
                { key: "close_rate_pct",    label: "Close Rate %",  type: "number" },
                { key: "revenue_generated", label: "Revenue £",     type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-zinc-500 mb-1">{f.label}</label>
                  <input
                    type={f.type}
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

          {/* Performance chart */}
          {chartData.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Performance Over Time</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Revenue (£)</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#111318", border: "1px solid #1e2130", borderRadius: 8, fontSize: 11 }} />
                      <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot={{ fill: "#7c3aed", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Show Rate & Close Rate (%)</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="week" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis unit="%" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "#111318", border: "1px solid #1e2130", borderRadius: 8, fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 10, color: "#71717a" }} />
                      <Line type="monotone" dataKey="show_rate" name="Show Rate" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
                      <Line type="monotone" dataKey="close_rate" name="Close Rate" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Weekly log table */}
          {clientMetrics.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Weekly Log</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1e2130]">
                      {["Week Starting", "Calls Booked", "Calls Taken", "Show Rate", "Close Rate", "Revenue", ""].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-zinc-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...clientMetrics].reverse().map(m => (
                      <tr key={m.id} className="border-b border-[#1e2130] hover:bg-zinc-800/20">
                        <td className="px-3 py-2 text-zinc-300 font-medium">{m.week_starting}</td>
                        <td className="px-3 py-2 text-zinc-400">{m.calls_booked}</td>
                        <td className="px-3 py-2 text-zinc-400">{m.calls_taken}</td>
                        <td className="px-3 py-2 text-zinc-400">{m.show_rate_pct != null ? `${m.show_rate_pct}%` : "—"}</td>
                        <td className="px-3 py-2 text-zinc-400">{m.close_rate_pct != null ? `${m.close_rate_pct}%` : "—"}</td>
                        <td className="px-3 py-2 text-emerald-400 font-medium">£{m.revenue_generated.toLocaleString("en-GB")}</td>
                        <td className="px-3 py-2">
                          {isAdmin && (
                            <button
                              onClick={() => onDelete(m.id)}
                              className="text-zinc-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
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
}

export default function ClientMetricsDashboard({ clients, allMetrics, isAdmin }: Props) {
  const [metrics, setMetrics] = useState<ClientMetric[]>(allMetrics);
  const [isPending, startTransition] = useTransition();

  function handleSave(data: Parameters<typeof upsertClientMetric>[0]) {
    // Optimistically update or insert
    setMetrics(prev => {
      const existing = prev.findIndex(m => m.client_id === data.client_id && m.week_starting === data.week_starting);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], ...data };
        return updated;
      }
      return [...prev, { id: crypto.randomUUID(), ...data, logged_by: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ClientMetric];
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

  // Overall totals across all clients
  const totalRevenue = metrics.reduce((s, m) => s + m.revenue_generated, 0);
  const totalCalls = metrics.reduce((s, m) => s + m.calls_taken, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Client Metrics</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{clients.length} active client{clients.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Summary strip */}
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
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
