"use client";

import { useState, useMemo, useTransition } from "react";
import { Plus, Trash2, Pencil, X, Check, TrendingUp, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { addProspect, updateProspect, deleteProspect, upsertTemplate } from "@/app/ascendry/actions";
import type { Prospect, AscendryTemplate } from "@/lib/ascendry-queries";

const TEMPLATES = ["A", "B", "C", "D", "E"] as const;
const REPLY_STATUSES = ["No Reply", "Replied", "Positive", "Call Booked"] as const;

const STATUS_COLORS: Record<string, string> = {
  "No Reply":    "bg-zinc-700 text-zinc-300",
  "Replied":     "bg-blue-600/20 text-blue-300 border border-blue-600/30",
  "Positive":    "bg-emerald-600/20 text-emerald-300 border border-emerald-600/30",
  "Call Booked": "bg-violet-600/20 text-violet-300 border border-violet-600/30",
};

type EditState = Partial<Omit<Prospect, "id" | "created_at">>;

interface AddFormState {
  prospect_name: string;
  instagram_handle: string;
  date_messaged: string;
  template_used: string;
  reply_status: string;
  call_booked: boolean;
  notes: string;
  followers_k: string;
}

const DEFAULT_FORM: AddFormState = {
  prospect_name: "",
  instagram_handle: "",
  date_messaged: new Date().toISOString().split("T")[0],
  template_used: "A",
  reply_status: "No Reply",
  call_booked: false,
  notes: "",
  followers_k: "",
};

function today() {
  return new Date().toISOString().split("T")[0];
}

// ── Template Manager ─────────────────────────────────────────

function TemplateManager({ templates: initial }: { templates: AscendryTemplate[] }) {
  const [templates, setTemplates] = useState<AscendryTemplate[]>(initial);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBody, setEditBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const templateMap = useMemo(() => {
    const map: Record<string, AscendryTemplate> = {};
    for (const t of templates) map[t.letter] = t;
    return map;
  }, [templates]);

  function startEdit(letter: string) {
    const t = templateMap[letter];
    setEditing(letter);
    setEditName(t?.name ?? "");
    setEditBody(t?.body ?? "");
  }

  function handleSave(letter: string) {
    setTemplates(prev => prev.map(t => t.letter === letter ? { ...t, name: editName, body: editBody } : t));
    setEditing(null);
    startTransition(async () => {
      try { await upsertTemplate(letter, editName, editBody); } catch {}
    });
  }

  return (
    <Card>
      <button className="w-full" onClick={() => setExpanded(v => !v)}>
        <CardHeader className="cursor-pointer hover:bg-zinc-800/20 transition-colors rounded-xl">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-zinc-500" />
            <CardTitle>Templates A–E</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Click to {expanded ? "collapse" : "view & edit"}</span>
            {expanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
          </div>
        </CardHeader>
      </button>

      {expanded && (
        <CardBody className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map(letter => {
              const t = templateMap[letter];
              const isEditing = editing === letter;
              return (
                <div key={letter} className="bg-[#0a0b0f] border border-[#1e2130] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-violet-600/20 border border-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300">
                        {letter}
                      </span>
                      {isEditing ? (
                        <input
                          autoFocus
                          className="input-base text-sm font-medium w-32"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="Template name"
                        />
                      ) : (
                        <span className="text-sm font-medium text-zinc-200">
                          {t?.name || <span className="text-zinc-600 italic">Unnamed</span>}
                        </span>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleSave(letter)} className="p-1 rounded text-emerald-400 hover:bg-emerald-400/10">
                          <Check size={13} />
                        </button>
                        <button onClick={() => setEditing(null)} className="p-1 rounded text-zinc-500 hover:bg-zinc-800">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(letter)} className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800">
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <textarea
                      className="input-base resize-none text-xs w-full"
                      rows={4}
                      value={editBody}
                      onChange={e => setEditBody(e.target.value)}
                      placeholder="Paste your template message here..."
                    />
                  ) : (
                    <p className="text-xs text-zinc-500 leading-relaxed whitespace-pre-wrap line-clamp-4">
                      {t?.body || <span className="italic">No content yet — click edit to add.</span>}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      )}
    </Card>
  );
}

// ── Main component ───────────────────────────────────────────

export default function OutreachTracker({
  prospects: initial,
  templates,
}: {
  prospects: Prospect[];
  templates: AscendryTemplate[];
}) {
  const [prospects, setProspects] = useState<Prospect[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddFormState>(DEFAULT_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({});
  const [isPending, startTransition] = useTransition();
  const [filterTemplate, setFilterTemplate] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const templateMap = useMemo(() => {
    const map: Record<string, AscendryTemplate> = {};
    for (const t of templates) map[t.letter] = t;
    return map;
  }, [templates]);

  const stats = useMemo(() => {
    const todayStr = today();
    const sentToday = prospects.filter(p => p.date_messaged === todayStr).length;
    const total = prospects.length;
    const replied = prospects.filter(p => p.reply_status !== "No Reply").length;
    const positive = prospects.filter(p => p.reply_status === "Positive" || p.reply_status === "Call Booked").length;
    const callsBooked = prospects.filter(p => p.call_booked).length;
    return {
      sentToday,
      replyRate: total > 0 ? Math.round((replied / total) * 100) : 0,
      positiveRate: total > 0 ? Math.round((positive / total) * 100) : 0,
      callsBooked,
    };
  }, [prospects]);

  const templateChartData = useMemo(() => {
    const byTemplate: Record<string, { sent: number; replied: number }> = {};
    for (const t of TEMPLATES) byTemplate[t] = { sent: 0, replied: 0 };
    for (const p of prospects) {
      if (!p.template_used) continue;
      byTemplate[p.template_used].sent++;
      if (p.reply_status !== "No Reply") byTemplate[p.template_used].replied++;
    }
    return TEMPLATES.map(t => {
      const tpl = templateMap[t];
      const label = tpl?.name ? `${t}: ${tpl.name}` : `Template ${t}`;
      return {
        name: label,
        letter: t,
        replyRate: byTemplate[t].sent > 0 ? Math.round((byTemplate[t].replied / byTemplate[t].sent) * 100) : 0,
        sent: byTemplate[t].sent,
      };
    });
  }, [prospects, templateMap]);

  const bestTemplate = useMemo(() => {
    const best = [...templateChartData].filter(t => t.sent > 0).sort((a, b) => b.replyRate - a.replyRate)[0];
    return best ?? null;
  }, [templateChartData]);

  const filtered = useMemo(() => {
    return prospects.filter(p => {
      if (filterTemplate !== "all" && p.template_used !== filterTemplate) return false;
      if (filterStatus !== "all" && p.reply_status !== filterStatus) return false;
      return true;
    });
  }, [prospects, filterTemplate, filterStatus]);

  function optimisticAdd(p: Prospect) { setProspects(prev => [p, ...prev]); }
  function optimisticUpdate(id: string, data: EditState) {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }
  function optimisticDelete(id: string) { setProspects(prev => prev.filter(p => p.id !== id)); }

  async function handleAdd() {
    if (!form.prospect_name.trim()) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.set(k, String(v)));
    const temp: Prospect = {
      id: crypto.randomUUID(),
      ...form,
      template_used: (form.template_used || null) as Prospect["template_used"],
      reply_status: form.reply_status as Prospect["reply_status"],
      created_at: new Date().toISOString(),
      instagram_handle: form.instagram_handle || null,
      notes: form.notes || null,
      followers_k: form.followers_k ? Number(form.followers_k) : null,
    };
    optimisticAdd(temp);
    setShowAdd(false);
    setForm(DEFAULT_FORM);
    startTransition(async () => {
      try { await addProspect(fd); } catch {}
    });
  }

  async function handleSaveEdit(id: string) {
    optimisticUpdate(id, editState);
    setEditId(null);
    startTransition(async () => {
      try { await updateProspect(id, editState); } catch {}
    });
  }

  async function handleDelete(id: string) {
    optimisticDelete(id);
    startTransition(async () => {
      try { await deleteProspect(id); } catch {}
    });
  }

  function startEdit(p: Prospect) {
    setEditId(p.id);
    setEditState({
      prospect_name: p.prospect_name,
      instagram_handle: p.instagram_handle,
      date_messaged: p.date_messaged,
      template_used: p.template_used,
      reply_status: p.reply_status,
      call_booked: p.call_booked,
      notes: p.notes,
    });
  }

  function templateLabel(letter: string | null) {
    if (!letter) return "—";
    const t = templateMap[letter];
    return t?.name ? `${letter}: ${t.name}` : `Template ${letter}`;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Outreach Tracker</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{prospects.length} prospects tracked</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(v => !v)}>
          <Plus size={14} className="mr-1.5" />
          Add Prospect
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Sent Today",         value: stats.sentToday,         suffix: "" },
          { label: "Reply Rate",          value: stats.replyRate,         suffix: "%" },
          { label: "Positive Reply Rate", value: stats.positiveRate,      suffix: "%" },
          { label: "Calls Booked",        value: stats.callsBooked,       suffix: "" },
        ].map(stat => (
          <Card key={stat.label} className="px-5 py-4">
            <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">
              {stat.value}<span className="text-zinc-400 text-base">{stat.suffix}</span>
            </p>
          </Card>
        ))}
      </div>

      {/* Template performance chart */}
      <Card>
        <CardHeader>
          <CardTitle>Template Performance</CardTitle>
          {bestTemplate && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
              <TrendingUp size={11} />
              {bestTemplate.name} winning
            </span>
          )}
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={templateChartData} barSize={36}>
              <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
              <YAxis unit="%" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ background: "#111318", border: "1px solid #1e2130", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#f0f2f8" }}
                formatter={(value) => [`${value}%`, "Reply Rate"]}
              />
              <Bar dataKey="replyRate" radius={[4, 4, 0, 0]}>
                {templateChartData.map(entry => (
                  <Cell key={entry.letter} fill={entry.letter === bestTemplate?.letter ? "#7c3aed" : "#3f3f46"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-4 mt-2">
            {templateChartData.map(t => (
              <div key={t.letter} className="text-xs text-zinc-500">
                <span className="text-zinc-400 font-medium">{t.name}</span>: {t.sent} sent · {t.replyRate}%
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Template editor */}
      <TemplateManager templates={templates} />

      {/* Add prospect form */}
      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>New Prospect</CardTitle>
            <button onClick={() => setShowAdd(false)} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Name *">
                <input className="input-base" value={form.prospect_name} onChange={e => setForm(f => ({ ...f, prospect_name: e.target.value }))} placeholder="John Smith" />
              </Field>
              <Field label="Instagram Handle">
                <input className="input-base" value={form.instagram_handle} onChange={e => setForm(f => ({ ...f, instagram_handle: e.target.value }))} placeholder="@handle" />
              </Field>
              <Field label="Followers (K)">
                <div className="relative">
                  <input type="number" min="0" className="input-base pr-8" value={form.followers_k} onChange={e => setForm(f => ({ ...f, followers_k: e.target.value }))} placeholder="e.g. 25" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none">K</span>
                </div>
              </Field>
              <Field label="Date Messaged">
                <input type="date" className="input-base" value={form.date_messaged} onChange={e => setForm(f => ({ ...f, date_messaged: e.target.value }))} />
              </Field>
              <Field label="Template">
                <select className="input-base" value={form.template_used} onChange={e => setForm(f => ({ ...f, template_used: e.target.value }))}>
                  {TEMPLATES.map(t => (
                    <option key={t} value={t}>{templateLabel(t)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Reply Status">
                <select className="input-base" value={form.reply_status} onChange={e => {
                  const rs = e.target.value;
                  setForm(f => ({ ...f, reply_status: rs, call_booked: rs === "Call Booked" ? true : f.call_booked }));
                }}>
                  {REPLY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Call Booked">
                <div className="flex items-center gap-3 h-9">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.call_booked} onChange={e => setForm(f => ({ ...f, call_booked: e.target.checked }))} className="w-4 h-4 rounded accent-violet-600" />
                    <span className="text-sm text-zinc-300">Yes</span>
                  </label>
                </div>
              </Field>
              <Field label="Notes" className="sm:col-span-2 lg:col-span-3">
                <textarea className="input-base resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
              </Field>
            </div>
            <div className="flex gap-3 mt-4">
              <Button size="sm" onClick={handleAdd} loading={isPending}>Add</Button>
              <Button size="sm" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input-base w-auto text-xs" value={filterTemplate} onChange={e => setFilterTemplate(e.target.value)}>
          <option value="all">All Templates</option>
          {TEMPLATES.map(t => <option key={t} value={t}>{templateLabel(t)}</option>)}
        </select>
        <select className="input-base w-auto text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          {REPLY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterTemplate !== "all" || filterStatus !== "all") && (
          <Button size="sm" variant="ghost" onClick={() => { setFilterTemplate("all"); setFilterStatus("all"); }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Prospects table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2130]">
                {["Name", "Handle", "Followers", "Date", "Template", "Status", "Call", "Notes", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-zinc-500 text-sm">
                    No prospects yet. Add your first one above.
                  </td>
                </tr>
              )}
              {filtered.map(p => {
                const isEditing = editId === p.id;
                return (
                  <tr key={p.id} className="border-b border-[#1e2130] hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-100 whitespace-nowrap">
                      {isEditing ? (
                        <input className="input-base w-32" value={editState.prospect_name ?? ""} onChange={e => setEditState(s => ({ ...s, prospect_name: e.target.value }))} />
                      ) : p.prospect_name}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {isEditing ? (
                        <input className="input-base w-28" value={editState.instagram_handle ?? ""} onChange={e => setEditState(s => ({ ...s, instagram_handle: e.target.value || null }))} />
                      ) : (p.instagram_handle ?? "—")}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {isEditing ? (
                        <div className="relative w-20">
                          <input type="number" min="0" className="input-base pr-6" value={editState.followers_k ?? ""} onChange={e => setEditState(s => ({ ...s, followers_k: e.target.value ? Number(e.target.value) : null }))} />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none">K</span>
                        </div>
                      ) : p.followers_k != null ? (
                        <span className="text-zinc-300 font-medium">{p.followers_k}K</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {isEditing ? (
                        <input type="date" className="input-base w-36" value={editState.date_messaged ?? ""} onChange={e => setEditState(s => ({ ...s, date_messaged: e.target.value }))} />
                      ) : p.date_messaged}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select className="input-base w-40" value={editState.template_used ?? ""} onChange={e => setEditState(s => ({ ...s, template_used: e.target.value as Prospect["template_used"] }))}>
                          {TEMPLATES.map(t => <option key={t} value={t}>{templateLabel(t)}</option>)}
                        </select>
                      ) : (
                        <div>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300">
                            {p.template_used ?? "—"}
                          </span>
                          {p.template_used && templateMap[p.template_used]?.name && (
                            <p className="text-xs text-zinc-600 mt-0.5 max-w-[100px] truncate">{templateMap[p.template_used].name}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select className="input-base w-36" value={editState.reply_status ?? "No Reply"} onChange={e => setEditState(s => ({ ...s, reply_status: e.target.value as Prospect["reply_status"] }))}>
                          {REPLY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[p.reply_status]}`}>
                          {p.reply_status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input type="checkbox" checked={editState.call_booked ?? false} onChange={e => setEditState(s => ({ ...s, call_booked: e.target.checked }))} className="w-4 h-4 accent-violet-600" />
                      ) : (
                        <span className={`text-xs font-medium ${p.call_booked ? "text-emerald-400" : "text-zinc-500"}`}>
                          {p.call_booked ? "Yes" : "No"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 max-w-[160px] truncate">
                      {isEditing ? (
                        <input className="input-base w-32" value={editState.notes ?? ""} onChange={e => setEditState(s => ({ ...s, notes: e.target.value || null }))} />
                      ) : (p.notes ?? "—")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveEdit(p.id)} className="p-1.5 rounded text-emerald-400 hover:bg-emerald-400/10"><Check size={14} /></button>
                            <button onClick={() => setEditId(null)} className="p-1.5 rounded text-zinc-400 hover:bg-zinc-700"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(p)} className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"><Pencil size={13} /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-400/10"><Trash2 size={13} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
