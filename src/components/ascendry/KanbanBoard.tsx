"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Trash2, Pencil, X, Check, GripVertical,
  Calendar, PoundSterling, Phone, Clock, AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { addClient, updateClient, deleteClient, moveClientStage } from "@/app/ascendry/actions";
import CallSlideOver from "@/components/ascendry/CallSlideOver";
import type { AscendryClient, CallSession, PitchDeck } from "@/lib/ascendry-queries";

const STAGES = [
  "Prospect",
  "Replied",
  "Call Booked",
  "Closed",
  "Active Client",
  "60-Day Review",
  "Exited",
] as const;

type Stage = (typeof STAGES)[number];

const STAGE_COLORS: Record<Stage, string> = {
  "Prospect":       "border-zinc-600 bg-zinc-600/10",
  "Replied":        "border-blue-600/40 bg-blue-600/10",
  "Call Booked":    "border-violet-600/40 bg-violet-600/10",
  "Closed":         "border-red-500/40 bg-red-500/10",
  "Active Client":  "border-emerald-500/40 bg-emerald-500/10",
  "60-Day Review":  "border-amber-500/40 bg-amber-500/10",
  "Exited":         "border-zinc-500/40 bg-zinc-800/30",
};

const STAGE_DOT: Record<Stage, string> = {
  "Prospect":       "bg-zinc-400",
  "Replied":        "bg-blue-400",
  "Call Booked":    "bg-violet-400",
  "Closed":         "bg-red-400",
  "Active Client":  "bg-emerald-400",
  "60-Day Review":  "bg-amber-400",
  "Exited":         "bg-zinc-500",
};

const OUTCOME_LABELS: Record<string, string> = {
  progressed:   "Progressed",
  closed:       "Closed",
  lost:         "Lost",
  follow_up:    "Follow Up",
  disqualified: "Disqualified",
};

const OUTCOME_COLORS: Record<string, string> = {
  progressed:   "text-violet-400 bg-violet-600/10 border-violet-600/20",
  closed:       "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  lost:         "text-zinc-500 bg-zinc-800 border-zinc-700",
  follow_up:    "text-amber-400 bg-amber-500/10 border-amber-500/20",
  disqualified: "text-red-400 bg-red-500/10 border-red-500/20",
};

const DEFAULT_FORM = {
  name: "",
  amount_gbp: "",
  start_date: "",
  stage: "Prospect" as Stage,
  next_action: "",
  notes: "",
};

function fmt(n: number | null): string {
  if (n == null) return "";
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─── Card helpers ─────────────────────────────────────────────────────────────

function clientSessions(client: AscendryClient, allSessions: CallSession[]): CallSession[] {
  return allSessions
    .filter(s => s.client_id === client.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function isDisqualified(sessions: CallSession[]): boolean {
  return sessions.some(
    s => s.outcome === "disqualified" || (s.disqualification_flags?.length ?? 0) > 0
  );
}

function isHighUrgency(sessions: CallSession[]): boolean {
  const latest = sessions[0];
  return latest?.urgency_level === "high" && !latest.outcome;
}

function followUpSession(sessions: CallSession[]): CallSession | null {
  return sessions.find(s => s.outcome === "follow_up") ?? null;
}

// ─── Kanban card content ──────────────────────────────────────────────────────

interface ClientCardProps {
  client: AscendryClient;
  sessions: CallSession[];
  isAdmin: boolean;
  onEdit: (c: AscendryClient) => void;
  onDelete: (id: string) => void;
  onOpenCall: (c: AscendryClient) => void;
  isDragging?: boolean;
}

function ClientCardContent({
  client, sessions, isAdmin, onEdit, onDelete, onOpenCall,
}: Omit<ClientCardProps, "isDragging">) {
  const disqualified = isDisqualified(sessions);
  const highUrgency = isHighUrgency(sessions);
  const followUp = followUpSession(sessions);
  const recentSessions = sessions.slice(0, 3);

  return (
    <div
      className={`bg-[#111318] rounded-xl p-3 space-y-2 shadow-sm border ${
        disqualified
          ? "border-red-500/50"
          : "border-[#1e2130]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {highUrgency && (
            <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400 mt-1" title="High urgency" />
          )}
          <p className="text-sm font-medium text-zinc-100 leading-snug truncate">{client.name}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
          <button
            onClick={() => onOpenCall(client)}
            className="p-1 rounded text-zinc-600 hover:text-violet-400 hover:bg-violet-600/10 transition-colors"
            title="Call scripts & playbook"
          >
            <Phone size={11} />
          </button>
          <button
            onClick={() => onEdit(client)}
            className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <Pencil size={11} />
          </button>
          {isAdmin && (
            <button
              onClick={() => onDelete(client.id)}
              className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {client.amount_gbp && (
        <div className="flex items-center gap-1 text-xs text-emerald-400">
          <PoundSterling size={10} />
          {client.amount_gbp.toLocaleString("en-GB")}
        </div>
      )}

      {client.start_date && (
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Calendar size={10} />
          {client.start_date}
        </div>
      )}

      {/* Follow-up badge */}
      {followUp && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">
          <Clock size={10} />
          <span>
            Follow up{followUp.next_call_scheduled_at
              ? `: ${fmtDate(followUp.next_call_scheduled_at)}`
              : " pending"}
          </span>
        </div>
      )}

      {client.next_action && !followUp && (
        <p className="text-xs text-zinc-500 border-t border-[#1e2130] pt-1.5 mt-1">
          → {client.next_action}
        </p>
      )}

      {/* Call history mini-timeline */}
      {recentSessions.length > 0 && (
        <div className="border-t border-[#1e2130] pt-2 mt-1 space-y-1.5">
          {recentSessions.map(s => (
            <div key={s.id} className="flex items-center gap-1.5">
              <Phone size={9} className="text-zinc-700 shrink-0" />
              <span className="text-[10px] text-zinc-600">
                {s.call_type === "diagnostic" ? "Call 1" : "Call 2"}
              </span>
              {s.outcome && (
                <span className={`text-[10px] px-1 py-0.5 rounded border ${OUTCOME_COLORS[s.outcome]}`}>
                  {OUTCOME_LABELS[s.outcome]}
                </span>
              )}
              <span className="text-[10px] text-zinc-700 ml-auto shrink-0">
                {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SortableCard({
  client, sessions, isAdmin, onEdit, onDelete, onOpenCall,
}: Omit<ClientCardProps, "isDragging">) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: client.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-zinc-700 group-hover:text-zinc-500 transition-colors z-10"
      >
        <GripVertical size={12} />
      </div>
      <div className="pl-4">
        <ClientCardContent
          client={client}
          sessions={sessions}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenCall={onOpenCall}
        />
      </div>
    </div>
  );
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  client: AscendryClient;
  onSave: (id: string, data: Partial<AscendryClient>) => void;
  onClose: () => void;
}

function EditModal({ client, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState({
    name: client.name,
    amount_gbp: client.amount_gbp?.toString() ?? "",
    start_date: client.start_date ?? "",
    stage: client.stage as Stage,
    next_action: client.next_action ?? "",
    notes: client.notes ?? "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#111318] border border-[#1e2130] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-white">Edit Client</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Name *</label>
            <input className="input-base w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Amount (£)</label>
            <input type="number" className="input-base w-full" value={form.amount_gbp} onChange={e => setForm(f => ({ ...f, amount_gbp: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Start Date</label>
            <input type="date" className="input-base w-full" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Stage</label>
            <select className="input-base w-full" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Next Action</label>
            <input className="input-base w-full" value={form.next_action} onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notes</label>
            <textarea className="input-base w-full resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <Button size="sm" onClick={() => {
            onSave(client.id, {
              name: form.name,
              amount_gbp: form.amount_gbp ? Number(form.amount_gbp) : null,
              start_date: form.start_date || null,
              stage: form.stage,
              next_action: form.next_action || null,
              notes: form.notes || null,
            });
            onClose();
          }}>
            <Check size={13} className="mr-1.5" />Save
          </Button>
          <Button size="sm" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Upcoming calls section ───────────────────────────────────────────────────

function UpcomingCallsSection({
  sessions, clients, onOpenCall,
}: { sessions: CallSession[]; clients: AscendryClient[]; onOpenCall: (c: AscendryClient) => void }) {
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcoming = sessions
    .filter(s =>
      s.scheduled_at &&
      s.status === "upcoming" &&
      new Date(s.scheduled_at) >= now &&
      new Date(s.scheduled_at) <= inSevenDays
    )
    .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!));

  if (upcoming.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} className="text-violet-400" />
        <h2 className="text-sm font-semibold text-zinc-300">Upcoming Calls — Next 7 Days</h2>
        <span className="text-xs text-zinc-600 ml-1">{upcoming.length}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {upcoming.map(s => {
          const clientRecord = clients.find(c => c.id === s.client_id);
          if (!clientRecord) return null;
          return (
            <div
              key={s.id}
              className="shrink-0 bg-[#111318] border border-[#1e2130] rounded-xl px-4 py-3 flex items-center gap-3 min-w-[220px] max-w-[280px]"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-600/15 border border-violet-600/20 flex items-center justify-center shrink-0">
                <Phone size={13} className="text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-100 truncate">{clientRecord.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {s.call_type === "diagnostic" ? "Call 1 — Diagnostic" : "Call 2 — Close"}
                </p>
                <p className="text-xs text-violet-400 mt-0.5">
                  {new Date(s.scheduled_at!).toLocaleString("en-GB", {
                    weekday: "short", day: "numeric", month: "short",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={() => onOpenCall(clientRecord)}
                className="shrink-0 p-1.5 rounded-lg text-zinc-500 hover:text-violet-400 hover:bg-violet-600/10 transition-colors"
                title="Open call prep"
              >
                <Phone size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main KanbanBoard ─────────────────────────────────────────────────────────

export default function KanbanBoard({
  clients: initial,
  isAdmin,
  initialSessions,
  initialDecks,
}: {
  clients: AscendryClient[];
  isAdmin: boolean;
  initialSessions: CallSession[];
  initialDecks: PitchDeck[];
}) {
  const [clients, setClients] = useState<AscendryClient[]>(initial);
  const [allSessions, setAllSessions] = useState<CallSession[]>(initialSessions);
  const [allDecks] = useState<PitchDeck[]>(initialDecks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddStage, setShowAddStage] = useState<Stage | null>(null);
  const [addForm, setAddForm] = useState(DEFAULT_FORM);
  const [editClient, setEditClient] = useState<AscendryClient | null>(null);
  const [callClient, setCallClient] = useState<AscendryClient | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const byStage = (stage: Stage) => clients.filter(c => c.stage === stage);
  const activeClient = activeId ? clients.find(c => c.id === activeId) ?? null : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    const targetStage = (STAGES as readonly string[]).includes(overId)
      ? (overId as Stage)
      : clients.find(c => c.id === overId)?.stage;

    if (!targetStage) return;
    const dragged = clients.find(c => c.id === draggedId);
    if (!dragged || dragged.stage === targetStage) return;

    setClients(prev => prev.map(c => c.id === draggedId ? { ...c, stage: targetStage } : c));
    startTransition(async () => {
      try { await moveClientStage(draggedId, targetStage); } catch {}
    });
  }

  async function handleAdd(stage: Stage) {
    if (!addForm.name.trim()) return;
    const fd = new FormData();
    fd.set("name", addForm.name);
    fd.set("stage", stage);
    if (addForm.amount_gbp) fd.set("amount_gbp", addForm.amount_gbp);
    if (addForm.start_date) fd.set("start_date", addForm.start_date);
    if (addForm.next_action) fd.set("next_action", addForm.next_action);
    if (addForm.notes) fd.set("notes", addForm.notes);

    const temp: AscendryClient = {
      id: crypto.randomUUID(),
      name: addForm.name,
      amount_gbp: addForm.amount_gbp ? Number(addForm.amount_gbp) : null,
      start_date: addForm.start_date || null,
      stage,
      next_action: addForm.next_action || null,
      notes: addForm.notes || null,
      stage_order: 0,
      created_at: new Date().toISOString(),
    };
    setClients(prev => [...prev, temp]);
    setShowAddStage(null);
    setAddForm(DEFAULT_FORM);
    startTransition(async () => {
      try { await addClient(fd); } catch {}
    });
  }

  function handleEdit(id: string, data: Partial<AscendryClient>) {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    startTransition(async () => {
      try { await updateClient(id, data); } catch {}
    });
  }

  function handleDelete(id: string) {
    setClients(prev => prev.filter(c => c.id !== id));
    startTransition(async () => {
      try { await deleteClient(id); } catch {}
    });
  }

  function handleSessionsChanged(updated: CallSession[], movedToStage?: string) {
    setAllSessions(updated);
    if (movedToStage && callClient) {
      setClients(prev => prev.map(c =>
        c.id === callClient.id ? { ...c, stage: movedToStage as Stage } : c
      ));
    }
  }

  return (
    <div className="max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Client Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{clients.length} clients total</p>
        </div>
      </div>

      <UpcomingCallsSection
        sessions={allSessions}
        clients={clients}
        onOpenCall={c => setCallClient(c)}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageClients = byStage(stage);
            const isAdding = showAddStage === stage;
            return (
              <div key={stage} id={stage} className="flex-shrink-0 w-60">
                {/* Column header */}
                <div className={`rounded-t-xl border border-b-0 px-3 py-2.5 flex items-center justify-between ${STAGE_COLORS[stage]}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${STAGE_DOT[stage]}`} />
                    <span className="text-xs font-semibold text-zinc-300">{stage}</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">{stageClients.length}</span>
                </div>

                {/* Column body */}
                <div className={`rounded-b-xl border border-t-0 p-2 min-h-[120px] ${STAGE_COLORS[stage]} bg-opacity-5`}>
                  <SortableContext items={stageClients.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {stageClients.map(c => (
                        <SortableCard
                          key={c.id}
                          client={c}
                          sessions={clientSessions(c, allSessions)}
                          isAdmin={isAdmin}
                          onEdit={c => setEditClient(c)}
                          onDelete={handleDelete}
                          onOpenCall={c => setCallClient(c)}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  {/* Add card form */}
                  {isAdding ? (
                    <div className="mt-2 bg-[#111318] border border-[#1e2130] rounded-xl p-3 space-y-2">
                      <input
                        autoFocus
                        className="input-base w-full text-xs"
                        placeholder="Client name *"
                        value={addForm.name}
                        onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") handleAdd(stage); if (e.key === "Escape") setShowAddStage(null); }}
                      />
                      <input
                        type="number"
                        className="input-base w-full text-xs"
                        placeholder="Amount £"
                        value={addForm.amount_gbp}
                        onChange={e => setAddForm(f => ({ ...f, amount_gbp: e.target.value }))}
                      />
                      <input
                        className="input-base w-full text-xs"
                        placeholder="Next action"
                        value={addForm.next_action}
                        onChange={e => setAddForm(f => ({ ...f, next_action: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAdd(stage)} loading={isPending}>Add</Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowAddStage(null)}><X size={12} /></Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setShowAddStage(stage); setAddForm(DEFAULT_FORM); }}
                      className="mt-2 w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40 transition-colors"
                    >
                      <Plus size={12} />
                      Add card
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeClient && (
            <div className="rotate-2 opacity-90 pl-4">
              <ClientCardContent
                client={activeClient}
                sessions={clientSessions(activeClient, allSessions)}
                isAdmin={isAdmin}
                onEdit={() => {}}
                onDelete={() => {}}
                onOpenCall={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {editClient && (
        <EditModal
          client={editClient}
          onSave={handleEdit}
          onClose={() => setEditClient(null)}
        />
      )}

      {callClient && (
        <CallSlideOver
          client={callClient}
          sessions={clientSessions(callClient, allSessions)}
          savedDeck={allDecks.find(d => d.client_id === callClient.id) ?? null}
          onClose={() => setCallClient(null)}
          onSessionsChanged={(updated, movedToStage) => {
            handleSessionsChanged(updated, movedToStage);
          }}
        />
      )}
    </div>
  );
}
