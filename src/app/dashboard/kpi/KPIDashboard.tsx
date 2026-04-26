"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { RefreshCw, Link2, Link2Off, Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface KPIEntry {
  month: number;
  ad_spend: number;
  follows: number;
  inb_leads: number;
  dms: number;
  convos: number;
  calls_taken: number;
  calls_closed: number;
  cash_collected: number;
  revenue: number;
}

interface SheetConnection {
  sheet_id: string;
  sheet_name: string;
  connected: boolean;
}

interface Props {
  year: number;
  initialEntries: KPIEntry[];
  initialConnection: SheetConnection | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

type ManualKey =
  | "ad_spend" | "follows" | "inb_leads" | "dms"
  | "convos" | "calls_taken" | "calls_closed"
  | "cash_collected" | "revenue";

// Ordered list of all editable keys for tab navigation
const EDITABLE_KEYS: ManualKey[] = [
  "ad_spend","follows","inb_leads","dms","convos","calls_taken","calls_closed","cash_collected","revenue",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyEntry(month: number): KPIEntry {
  return { month, ad_spend: 0, follows: 0, inb_leads: 0, dms: 0, convos: 0, calls_taken: 0, calls_closed: 0, cash_collected: 0, revenue: 0 };
}

function pct(num: number, denom: number): string {
  if (!denom) return "-";
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function fmtCurrency(n: number): string {
  if (!n) return "$0";
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtInt(n: number): string {
  if (!n) return "0";
  return n.toLocaleString("en-US");
}

function fmtValue(key: ManualKey, n: number): string {
  if (key === "ad_spend" || key === "cash_collected" || key === "revenue") return fmtCurrency(n);
  return fmtInt(n);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function KPIDashboard({ year, initialEntries, initialConnection }: Props) {
  // Build a full 12-month map from initial data
  const buildRows = useCallback((entries: KPIEntry[]): KPIEntry[] => {
    const map = new Map<number, KPIEntry>(entries.map((e) => [e.month, e]));
    return MONTHS.map((_, i) => map.get(i + 1) ?? emptyEntry(i + 1));
  }, []);

  const [rows, setRows] = useState<KPIEntry[]>(() => buildRows(initialEntries));
  const [editing, setEditing] = useState<{ month: number; key: ManualKey } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const [connection, setConnection] = useState<SheetConnection | null>(initialConnection);
  const [sheetIdInput, setSheetIdInput] = useState(initialConnection?.sheet_id ?? "");
  const [sheetNameInput, setSheetNameInput] = useState(initialConnection?.sheet_name ?? "");
  const [syncing, setSyncing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // ── Computed totals ────────────────────────────────────────────────────────
  const totals: KPIEntry = rows.reduce(
    (acc, r) => ({
      month: 0,
      ad_spend:       acc.ad_spend       + r.ad_spend,
      follows:        acc.follows        + r.follows,
      inb_leads:      acc.inb_leads      + r.inb_leads,
      dms:            acc.dms            + r.dms,
      convos:         acc.convos         + r.convos,
      calls_taken:    acc.calls_taken    + r.calls_taken,
      calls_closed:   acc.calls_closed   + r.calls_closed,
      cash_collected: acc.cash_collected + r.cash_collected,
      revenue:        acc.revenue        + r.revenue,
    }),
    emptyEntry(0)
  );

  // ── Cell edit handlers ─────────────────────────────────────────────────────
  function startEdit(month: number, key: ManualKey, current: number) {
    setEditing({ month, key });
    setEditValue(
      key === "ad_spend" || key === "cash_collected" || key === "revenue"
        ? (current === 0 ? "" : current.toString())
        : (current === 0 ? "" : current.toString())
    );
  }

  async function commitEdit(month: number, key: ManualKey, raw: string) {
    setEditing(null);
    const parsed = parseFloat(raw.replace(/[$,]/g, "")) || 0;
    const prev = rows.find((r) => r.month === month)?.[key] ?? 0;
    if (parsed === prev) return;

    // Optimistic update
    setRows((prev) => prev.map((r) => r.month === month ? { ...r, [key]: parsed } : r));

    const saveKey = `${month}-${key}`;
    setSaving((s) => new Set(s).add(saveKey));

    try {
      const res = await fetch("/api/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, field: key, value: parsed }),
      });
      if (!res.ok) throw new Error("Save failed");
    } catch {
      setToast({ msg: "Failed to save. Please try again.", type: "err" });
      setRows((prev) => prev.map((r) => r.month === month ? { ...r, [key]: prev } : r));
    } finally {
      setSaving((s) => { const n = new Set(s); n.delete(saveKey); return n; });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, month: number, key: ManualKey) {
    if (e.key === "Enter") {
      commitEdit(month, key, editValue);
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitEdit(month, key, editValue);
      // Move to next cell
      const shift = e.shiftKey;
      const keyIdx = EDITABLE_KEYS.indexOf(key);
      let nextKeyIdx = shift ? keyIdx - 1 : keyIdx + 1;
      let nextMonth = month;
      if (nextKeyIdx < 0) { nextKeyIdx = EDITABLE_KEYS.length - 1; nextMonth = month - 1; }
      if (nextKeyIdx >= EDITABLE_KEYS.length) { nextKeyIdx = 0; nextMonth = month + 1; }
      if (nextMonth >= 1 && nextMonth <= 12) {
        const nextKey = EDITABLE_KEYS[nextKeyIdx];
        const nextRow = rows.find((r) => r.month === nextMonth);
        if (nextRow) startEdit(nextMonth, nextKey, nextRow[nextKey]);
      }
    } else if (e.key === "Escape") {
      setEditing(null);
    }
  }

  // ── Sync handlers ──────────────────────────────────────────────────────────
  async function handleSync(direction: "pull" | "push") {
    if (!connection) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/google/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          year,
          sheetId: sheetIdInput,
          sheetName: sheetNameInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");

      if (direction === "pull") {
        // Reload data from server
        const kpiRes = await fetch(`/api/kpi?year=${year}`);
        const kpiData = await kpiRes.json();
        if (kpiData.entries) setRows(buildRows(kpiData.entries));
        setToast({ msg: `Imported ${data.imported} month(s) from sheet`, type: "ok" });
      } else {
        setToast({ msg: `Pushed ${data.pushed} month(s) to sheet`, type: "ok" });
      }
    } catch (err) {
      setToast({ msg: err instanceof Error ? err.message : "Sync failed", type: "err" });
    } finally {
      setSyncing(false);
    }
  }

  async function handleSaveSheetConfig() {
    if (!sheetIdInput) return;
    const res = await fetch("/api/google/sync", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheet_id: sheetIdInput, sheet_name: sheetNameInput }),
    });
    if (res.ok) {
      setConnection((c) => c ? { ...c, sheet_id: sheetIdInput, sheet_name: sheetNameInput } : c);
      setToast({ msg: "Sheet config saved", type: "ok" });
    }
  }

  async function handleDisconnect() {
    await fetch("/api/google/disconnect", { method: "POST" });
    setConnection(null);
    setSheetIdInput("");
    setSheetNameInput("");
    setToast({ msg: "Google Sheet disconnected", type: "ok" });
  }

  // ── Render cell ────────────────────────────────────────────────────────────
  function EditableCell({ row, field }: { row: KPIEntry; field: ManualKey }) {
    const isEditing = editing?.month === row.month && editing?.key === field;
    const isSaving = saving.has(`${row.month}-${field}`);
    const value = row[field];

    return (
      <td
        className="px-3 py-2 text-center cursor-pointer relative"
        onClick={() => !isEditing && startEdit(row.month, field, value)}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => commitEdit(row.month, field, editValue)}
            onKeyDown={(e) => handleKeyDown(e, row.month, field)}
            className="w-full bg-white/10 border border-violet-400/60 rounded px-2 py-0.5 text-white text-center text-xs outline-none focus:border-violet-400"
          />
        ) : (
          <span className={`text-xs font-bold ${isSaving ? "opacity-50" : "text-white"}`}>
            {fmtValue(field, value)}
          </span>
        )}
      </td>
    );
  }

  // ── Row renderer ───────────────────────────────────────────────────────────
  function renderRow(row: KPIEntry, isOdd: boolean) {
    return (
      <tr key={row.month} className={isOdd ? "bg-[#1a1a1a]" : "bg-[#222]"}>
        <td className="px-3 py-2 text-xs font-bold uppercase text-white whitespace-nowrap">
          {MONTHS[row.month - 1]}
        </td>
        <EditableCell row={row} field="ad_spend" />
        <EditableCell row={row} field="follows" />
        <EditableCell row={row} field="inb_leads" />
        <EditableCell row={row} field="dms" />
        <td className="px-3 py-2 text-center text-xs font-bold text-gray-300">
          {pct(row.convos, row.dms)}
        </td>
        <EditableCell row={row} field="convos" />
        <td className="px-3 py-2 text-center text-xs font-bold text-gray-300">
          {pct(row.calls_taken, row.convos)}
        </td>
        <EditableCell row={row} field="calls_taken" />
        <td className="px-3 py-2 text-center text-xs font-bold text-gray-300">
          {pct(row.calls_closed, row.calls_taken)}
        </td>
        <EditableCell row={row} field="calls_closed" />
        <EditableCell row={row} field="cash_collected" />
        <EditableCell row={row} field="revenue" />
      </tr>
    );
  }

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-semibold border transition-all
          ${toast.type === "ok"
            ? "bg-green-900/90 border-green-500/40 text-green-200"
            : "bg-red-900/90 border-red-500/40 text-red-200"}`}>
          {toast.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Title block */}
      <div>
        <h1 className="text-2xl font-black uppercase text-white tracking-widest">{year} TOTALS</h1>
        <div className="mt-1 inline-block px-6 py-1.5 bg-purple-700 rounded">
          <span className="text-sm font-black uppercase text-white tracking-widest">CLOSING</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full border-collapse bg-[#111]">
          <thead>
            <tr className="bg-orange-500">
              {[
                "Month","Ad Spend","Follows","INB Leads","DMs","DMs to Convo %",
                "Convos","Convo to Call %","Calls Taken","Close %","Calls Closed",
                "Cash Collected","Revenue",
              ].map((col) => (
                <th
                  key={col}
                  className="px-3 py-2.5 text-xs font-black uppercase tracking-wider text-black text-center whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => renderRow(row, i % 2 === 0))}
          </tbody>
          <tfoot>
            <tr className="bg-orange-500">
              <td className="px-3 py-2.5 text-xs font-black uppercase text-black">TOTALS</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{fmtCurrency(totals.ad_spend)}</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{fmtInt(totals.follows)}</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{fmtInt(totals.inb_leads)}</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{fmtInt(totals.dms)}</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{pct(totals.convos, totals.dms)}</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{fmtInt(totals.convos)}</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{pct(totals.calls_taken, totals.convos)}</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{fmtInt(totals.calls_taken)}</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{pct(totals.calls_closed, totals.calls_taken)}</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{fmtInt(totals.calls_closed)}</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{fmtCurrency(totals.cash_collected)}</td>
              <td className="px-3 py-2.5 text-center text-xs font-black text-black">{fmtCurrency(totals.revenue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Google Sheets Sync Panel */}
      <div className="border border-white/10 rounded-xl bg-[#111] p-5 space-y-4 max-w-2xl">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connection?.connected ? "bg-green-400" : "bg-gray-600"}`} />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Google Sheets Sync</h2>
        </div>

        {!connection ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">Connect your Google Sheet to sync data in both directions.</p>
            <a
              href="/api/google/connect"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Connect Google Sheet
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Sheet ID
                </label>
                <input
                  type="text"
                  value={sheetIdInput}
                  onChange={(e) => setSheetIdInput(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-violet-500/50 font-mono"
                />
                <p className="mt-1 text-[10px] text-gray-600">Found in the sheet URL after /spreadsheets/d/</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Sheet Tab Name (optional)
                </label>
                <input
                  type="text"
                  value={sheetNameInput}
                  onChange={(e) => setSheetNameInput(e.target.value)}
                  placeholder="Sheet1"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-violet-500/50"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveSheetConfig}
                disabled={!sheetIdInput}
                className="px-4 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg transition-colors"
              >
                Save Config
              </button>

              <button
                onClick={() => handleSync("pull")}
                disabled={syncing || !sheetIdInput}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg transition-colors"
              >
                {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Sync from Sheet
              </button>

              <button
                onClick={() => handleSync("push")}
                disabled={syncing || !sheetIdInput}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-green-800 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg transition-colors"
              >
                {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                Sync to Sheet
              </button>

              <button
                onClick={handleDisconnect}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors ml-auto"
              >
                <Link2Off className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VA Access Note */}
      <div className="border border-white/[0.06] rounded-xl bg-[#111] p-4 max-w-2xl">
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-400">VA Access:</span>{" "}
          To allow a VA to enter data here, share your ApexCard invite link with them. They will get scoped access to this dashboard only — no other parts of your account.
        </p>
      </div>
    </div>
  );
}
