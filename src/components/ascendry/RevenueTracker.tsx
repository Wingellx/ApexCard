"use client";

import { useState, useMemo, useTransition } from "react";
import { Plus, Trash2, Pencil, X, Check, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardBody, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { addPayment, updatePayment, deletePayment } from "@/app/ascendry/actions";
import type { Payment } from "@/lib/ascendry-queries";

const DEFAULT_FORM = {
  payment_date: new Date().toISOString().split("T")[0],
  client_name: "",
  amount_gbp: "",
  is_overdue: false,
  notes: "",
};

export default function RevenueTracker({ payments: initial }: { payments: Payment[] }) {
  const [payments, setPayments] = useState<Payment[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Partial<Payment>>({});
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const total = payments.reduce((s, p) => s + p.amount_gbp, 0);
    const overdue = payments.filter(p => p.is_overdue).length;
    return {
      total,
      jacobShare: total / 2,
      davidShare: total / 2,
      overdueCount: overdue,
    };
  }, [payments]);

  function optimisticAdd(p: Payment) { setPayments(prev => [p, ...prev]); }
  function optimisticUpdate(id: string, data: Partial<Payment>) {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }
  function optimisticDelete(id: string) { setPayments(prev => prev.filter(p => p.id !== id)); }

  async function handleAdd() {
    if (!form.client_name.trim() || !form.amount_gbp) return;
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.set(k, String(v)));
    const temp: Payment = {
      id: crypto.randomUUID(),
      payment_date: form.payment_date,
      client_name: form.client_name,
      amount_gbp: Number(form.amount_gbp),
      is_overdue: form.is_overdue,
      notes: form.notes || null,
      created_at: new Date().toISOString(),
    };
    optimisticAdd(temp);
    setShowAdd(false);
    setForm(DEFAULT_FORM);
    startTransition(async () => {
      try { await addPayment(fd); } catch {}
    });
  }

  async function handleSaveEdit(id: string) {
    optimisticUpdate(id, editState);
    setEditId(null);
    startTransition(async () => {
      try { await updatePayment(id, editState); } catch {}
    });
  }

  async function handleDelete(id: string) {
    optimisticDelete(id);
    startTransition(async () => {
      try { await deletePayment(id); } catch {}
    });
  }

  function startEdit(p: Payment) {
    setEditId(p.id);
    setEditState({ payment_date: p.payment_date, client_name: p.client_name, amount_gbp: p.amount_gbp, is_overdue: p.is_overdue, notes: p.notes });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Revenue Tracker</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{payments.length} payment{payments.length !== 1 ? "s" : ""} logged</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(v => !v)}>
          <Plus size={14} className="mr-1.5" />
          Log Payment
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Earned",   value: `£${stats.total.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, highlight: false },
          { label: "Jacob's Share",  value: `£${stats.jacobShare.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, highlight: false },
          { label: "David's Share",  value: `£${stats.davidShare.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, highlight: false },
          { label: "Overdue",        value: stats.overdueCount.toString(), highlight: stats.overdueCount > 0 },
        ].map(stat => (
          <Card key={stat.label} className={`px-5 py-4 ${stat.highlight ? "border-amber-500/30 bg-amber-500/5" : ""}`}>
            <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.highlight ? "text-amber-400" : "text-white"}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* 50/50 split note */}
      <div className="flex items-center gap-2 px-4 py-3 bg-violet-600/10 border border-violet-600/20 rounded-xl">
        <div className="w-1 h-8 bg-violet-600 rounded-full shrink-0" />
        <p className="text-xs text-zinc-400">
          Revenue is split <span className="text-violet-300 font-medium">50/50</span> between Jacob and David. Each retainer payment logs automatically towards both shares.
        </p>
      </div>

      {/* Overdue warning */}
      {stats.overdueCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300 font-medium">
            {stats.overdueCount} overdue retainer{stats.overdueCount !== 1 ? "s" : ""} — chase payment
          </p>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Log Payment</CardTitle>
            <button onClick={() => setShowAdd(false)} className="text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Date *</label>
                <input type="date" className="input-base w-full" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Client Name *</label>
                <input className="input-base w-full" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Client name" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Amount (£) *</label>
                <input type="number" min="0" step="0.01" className="input-base w-full" value={form.amount_gbp} onChange={e => setForm(f => ({ ...f, amount_gbp: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="flex items-center gap-3 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_overdue}
                    onChange={e => setForm(f => ({ ...f, is_overdue: e.target.checked }))}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span className="text-sm text-zinc-300">Mark as overdue</span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-zinc-400 mb-1.5">Notes</label>
                <input className="input-base w-full" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional..." />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button size="sm" onClick={handleAdd} loading={isPending}>Add</Button>
              <Button size="sm" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Payments table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2130]">
                {["Date", "Client", "Amount", "Jacob", "David", "Status", "Notes", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-zinc-500 text-sm">
                    No payments logged yet.
                  </td>
                </tr>
              )}
              {payments.map(p => {
                const isEditing = editId === p.id;
                const half = p.amount_gbp / 2;
                return (
                  <tr key={p.id} className={`border-b border-[#1e2130] hover:bg-zinc-800/20 transition-colors ${p.is_overdue ? "bg-amber-500/5" : ""}`}>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {isEditing ? (
                        <input type="date" className="input-base w-36" value={editState.payment_date ?? ""} onChange={e => setEditState(s => ({ ...s, payment_date: e.target.value }))} />
                      ) : p.payment_date}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-100 whitespace-nowrap">
                      {isEditing ? (
                        <input className="input-base w-32" value={editState.client_name ?? ""} onChange={e => setEditState(s => ({ ...s, client_name: e.target.value }))} />
                      ) : p.client_name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-400 whitespace-nowrap">
                      {isEditing ? (
                        <input type="number" className="input-base w-24" value={editState.amount_gbp ?? ""} onChange={e => setEditState(s => ({ ...s, amount_gbp: Number(e.target.value) }))} />
                      ) : `£${p.amount_gbp.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">£{half.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">£{half.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={editState.is_overdue ?? false} onChange={e => setEditState(s => ({ ...s, is_overdue: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
                          <span className="text-xs text-zinc-400">Overdue</span>
                        </label>
                      ) : p.is_overdue ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                          <AlertTriangle size={10} />Overdue
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">Paid</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 max-w-[120px] truncate">
                      {isEditing ? (
                        <input className="input-base w-28" value={editState.notes ?? ""} onChange={e => setEditState(s => ({ ...s, notes: e.target.value || null }))} />
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
