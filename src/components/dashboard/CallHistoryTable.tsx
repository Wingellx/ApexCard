"use client";

import { useState, useTransition } from "react";
import { updateCallLog, deleteCallLog } from "@/app/dashboard/history/actions";
import { Pencil, Trash2, Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogRow {
  id: string;
  date: string;
  calls_taken: number;
  shows: number;
  offers_made: number;
  offers_taken: number;
  cash_collected: number;
  commission_earned: number;
  notes: string | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function pct(num: number, den: number) {
  return den > 0 ? `${((num / den) * 100).toFixed(0)}%` : "—";
}

interface EditState {
  calls_taken: string;
  shows: string;
  offers_made: string;
  offers_taken: string;
  cash_collected: string;
  commission_earned: string;
  notes: string;
}

function numInput(value: string, onChange: (v: string) => void, prefix?: string) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#6b7280]">{prefix}</span>}
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full bg-[#0d0f15] border border-indigo-500/40 rounded px-2 py-1 text-xs text-[#f0f2f8]",
          "focus:outline-none focus:border-indigo-500 tabular-nums",
          prefix ? "pl-5" : ""
        )}
      />
    </div>
  );
}

function EditRow({ row, onCancel }: { row: LogRow; onCancel: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [vals, setVals] = useState<EditState>({
    calls_taken:       String(row.calls_taken),
    shows:             String(row.shows),
    offers_made:       String(row.offers_made),
    offers_taken:      String(row.offers_taken),
    cash_collected:    String(row.cash_collected),
    commission_earned: String(row.commission_earned),
    notes:             row.notes ?? "",
  });

  function set(key: keyof EditState) {
    return (v: string) => setVals((p) => ({ ...p, [key]: v }));
  }

  function handleSave() {
    const fd = new FormData();
    Object.entries(vals).forEach(([k, v]) => fd.append(k, v));
    startTransition(async () => {
      const result = await updateCallLog(row.id, null, fd);
      if (result?.error) setError(result.error);
      else onCancel();
    });
  }

  return (
    <>
      <tr className="border-b border-indigo-500/20 bg-indigo-500/5">
        <td className="px-4 py-2 text-xs text-[#6b7280] whitespace-nowrap">{fmtDate(row.date)}</td>
        <td className="px-4 py-2 w-20">{numInput(vals.calls_taken, set("calls_taken"))}</td>
        <td className="px-4 py-2 w-20">{numInput(vals.shows, set("shows"))}</td>
        <td className="px-4 py-2 text-xs text-[#6b7280] tabular-nums">
          {Math.max((parseInt(vals.calls_taken) || 0) - (parseInt(vals.shows) || 0), 0)}
        </td>
        <td className="px-4 py-2 w-20">{numInput(vals.offers_made, set("offers_made"))}</td>
        <td className="px-4 py-2 w-20">{numInput(vals.offers_taken, set("offers_taken"))}</td>
        <td className="px-4 py-2 w-28">{numInput(vals.cash_collected, set("cash_collected"), "$")}</td>
        <td className="px-4 py-2 w-28">{numInput(vals.commission_earned, set("commission_earned"), "$")}</td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors disabled:opacity-50"
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white/5 hover:bg-white/10 text-[#6b7280] rounded transition-colors"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </td>
      </tr>
      {error && (
        <tr className="border-b border-[#1e2130]">
          <td colSpan={9} className="px-4 py-2">
            <p className="text-xs text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> {error}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}

function DisplayRow({ row, onEdit }: { row: LogRow; onEdit: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const noShows   = row.calls_taken - row.shows;
  const showRate  = pct(row.shows, row.calls_taken);
  const closeRate = pct(row.offers_taken, row.shows);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCallLog(row.id);
      if (result?.error) { setError(result.error); setConfirming(false); }
    });
  }

  return (
    <>
      <tr className="border-b border-[#1e2130]/60 hover:bg-white/[0.02] transition-colors group">
        <td className="px-4 py-3.5 text-sm text-[#f0f2f8] font-medium whitespace-nowrap">{fmtDate(row.date)}</td>
        <td className="px-4 py-3.5 text-sm text-[#f0f2f8] tabular-nums">{row.calls_taken}</td>
        <td className="px-4 py-3.5 tabular-nums">
          <span className={cn("text-sm font-medium", Number(showRate) >= 70 ? "text-emerald-400" : "text-amber-400")}>
            {row.shows}
          </span>
          <span className="text-xs text-[#6b7280] ml-1">({showRate})</span>
        </td>
        <td className="px-4 py-3.5 text-sm tabular-nums">
          <span className={noShows > 3 ? "text-rose-400" : "text-[#6b7280]"}>{noShows}</span>
        </td>
        <td className="px-4 py-3.5 text-sm text-[#f0f2f8] tabular-nums">{row.offers_made}</td>
        <td className="px-4 py-3.5 tabular-nums">
          <span className={cn("text-sm font-medium", parseFloat(closeRate) >= 30 ? "text-emerald-400" : parseFloat(closeRate) >= 20 ? "text-amber-400" : "text-rose-400")}>
            {row.offers_taken}
          </span>
          <span className="text-xs text-[#6b7280] ml-1">({closeRate})</span>
        </td>
        <td className="px-4 py-3.5 text-sm text-emerald-400 font-semibold tabular-nums">{fmt(row.cash_collected)}</td>
        <td className="px-4 py-3.5 text-sm text-violet-400 font-semibold tabular-nums">{fmt(row.commission_earned)}</td>
        <td className="px-4 py-3.5">
          {confirming ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-rose-400 mr-1">Delete?</span>
              <button onClick={handleDelete} disabled={isPending}
                className="px-2 py-1 text-xs font-semibold bg-rose-500/20 text-rose-400 rounded hover:bg-rose-500/30 transition-colors disabled:opacity-50">
                Yes
              </button>
              <button onClick={() => setConfirming(false)}
                className="px-2 py-1 text-xs font-semibold bg-white/5 text-[#6b7280] rounded hover:bg-white/10 transition-colors">
                No
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit}
                className="p-1.5 text-[#6b7280] hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setConfirming(true)}
                className="p-1.5 text-[#6b7280] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
        </td>
      </tr>
    </>
  );
}

export default function CallHistoryTable({ logs }: { logs: LogRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (logs.length === 0) {
    return (
      <div className="bg-[#111318] border border-dashed border-[#1e2130] rounded-xl p-14 text-center">
        <p className="text-[#f0f2f8] font-semibold mb-1">No call logs yet</p>
        <p className="text-sm text-[#6b7280]">Start logging your calls and they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-[#1e2130]">
              {["Date", "Calls", "Shows", "No Shows", "Offers", "Closed", "Cash", "Commission", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((row) =>
              editingId === row.id ? (
                <EditRow key={row.id} row={row} onCancel={() => setEditingId(null)} />
              ) : (
                <DisplayRow key={row.id} row={row} onEdit={() => setEditingId(row.id)} />
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
