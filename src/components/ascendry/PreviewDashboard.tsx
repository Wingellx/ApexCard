"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Pencil, Check } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface RepData {
  leadsAssigned: number;
  callsBooked: number;
  showRate: number;
  callsTaken: number;
  closeRate: number;
  cashCollected: number;
  noShows: number;
  followUps: number;
}

const BLANK: RepData = {
  leadsAssigned: 0,
  callsBooked: 0,
  showRate: 0,
  callsTaken: 0,
  closeRate: 0,
  cashCollected: 0,
  noShows: 0,
  followUps: 0,
};

// ─── Count-up ────────────────────────────────────────────────────────────────

function useCountUp(target: number, animKey: number, duration = 900) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    setValue(0);
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, animKey, duration]);

  return value;
}

// ─── Editable number field ────────────────────────────────────────────────────

interface EditableProps {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  isPercent?: boolean;
  className?: string;
  animKey: number;
  editMode: boolean;
  inputClass?: string;
}

function EditableNumber({ value, onChange, prefix = "", suffix = "", className, animKey, editMode, inputClass }: EditableProps) {
  const animated = useCountUp(value, animKey);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editMode && inputRef.current) inputRef.current.select();
  }, [editMode]);

  if (editMode) {
    return (
      <div className="relative">
        {prefix && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">{prefix}</span>}
        <input
          ref={inputRef}
          type="number"
          min={0}
          defaultValue={value || ""}
          onBlur={e => onChange(parseFloat(e.target.value) || 0)}
          onKeyDown={e => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className={cn(
            "w-full bg-[#12131f] border border-violet-500/40 rounded-lg text-white font-bold outline-none focus:border-violet-400 text-right pr-2 py-1.5 tabular-nums",
            prefix && "pl-6",
            inputClass
          )}
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">{suffix}</span>}
      </div>
    );
  }

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}{animated.toLocaleString("en-GB")}{suffix}
    </span>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: `${color}30` }} />
    </div>
  );
}

// ─── Metric box ───────────────────────────────────────────────────────────────

function MetricBox({
  label, value, onChange, prefix, suffix, className, animKey, editMode, accent,
}: {
  label: string; value: number; onChange: (v: number) => void;
  prefix?: string; suffix?: string; className?: string;
  animKey: number; editMode: boolean; accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-semibold text-zinc-600 uppercase tracking-widest">{label}</span>
      <div className={cn("text-2xl font-bold", accent ?? "text-white")}>
        <EditableNumber
          value={value} onChange={onChange}
          prefix={prefix} suffix={suffix}
          animKey={animKey} editMode={editMode}
          inputClass="text-xl"
        />
      </div>
    </div>
  );
}

// ─── Rep card ─────────────────────────────────────────────────────────────────

function RepCard({
  name, data, onChange, color, dimColor, borderColor, bgColor, animKey, editMode,
}: {
  name: string;
  data: RepData;
  onChange: (patch: Partial<RepData>) => void;
  color: string;
  dimColor: string;
  borderColor: string;
  bgColor: string;
  animKey: number;
  editMode: boolean;
}) {
  const animated = useCountUp(data.cashCollected, animKey);

  const set = (key: keyof RepData) => (v: number) => onChange({ [key]: v });

  return (
    <div
      className="rounded-2xl border flex flex-col overflow-hidden"
      style={{ borderColor, background: "#0b0c16" }}
    >
      {/* Rep header */}
      <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: bgColor, borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: color, boxShadow: `0 0 18px ${color}55` }}>
            {name[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{name}</p>
            <p className="text-xs" style={{ color: dimColor }}>Sales Rep</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-0.5">Cash Collected</p>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">
            {editMode ? (
              <EditableNumber value={data.cashCollected} onChange={set("cashCollected")} prefix="£" animKey={animKey} editMode={editMode} inputClass="text-xl w-28" />
            ) : (
              <>£{animated.toLocaleString("en-GB")}</>
            )}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-4 flex flex-col gap-4 flex-1">

        {/* Setting */}
        <div>
          <SectionLabel label="Setting" color={color} />
          <div className="grid grid-cols-3 gap-3">
            <MetricBox label="Leads" value={data.leadsAssigned} onChange={set("leadsAssigned")} animKey={animKey} editMode={editMode} />
            <MetricBox label="Booked" value={data.callsBooked} onChange={set("callsBooked")} animKey={animKey} editMode={editMode} />
            <MetricBox label="Show Rate" value={data.showRate} onChange={set("showRate")} suffix="%" animKey={animKey} editMode={editMode}
              accent={data.showRate >= 70 ? "text-emerald-400" : data.showRate >= 50 ? "text-amber-400" : "text-white"} />
          </div>
        </div>

        {/* Closing */}
        <div>
          <SectionLabel label="Closing" color={color} />
          <div className="grid grid-cols-3 gap-3 mb-3">
            <MetricBox label="Calls Taken" value={data.callsTaken} onChange={set("callsTaken")} animKey={animKey} editMode={editMode} />
            <MetricBox label="Close Rate" value={data.closeRate} onChange={set("closeRate")} suffix="%" animKey={animKey} editMode={editMode}
              accent={data.closeRate >= 30 ? "text-emerald-400" : data.closeRate >= 20 ? "text-amber-400" : "text-white"} />
            <MetricBox label="No Shows" value={data.noShows} onChange={set("noShows")} animKey={animKey} editMode={editMode}
              accent={data.noShows > 3 ? "text-amber-400" : "text-white"} />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <MetricBox label="Follow Ups Pending" value={data.followUps} onChange={set("followUps")} animKey={animKey} editMode={editMode} accent="text-zinc-400" />
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Hero stat ────────────────────────────────────────────────────────────────

function HeroStat({ label, value, prefix = "", suffix = "", animKey }: {
  label: string; value: number; prefix?: string; suffix?: string; animKey: number;
}) {
  const animated = useCountUp(value, animKey);
  return (
    <div className="text-center">
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums">
        {prefix}{animated.toLocaleString("en-GB")}{suffix}
      </p>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const REP_CONFIGS = {
  david: { color: "#7c3aed", dimColor: "#a78bfa", borderColor: "rgba(124,58,237,0.22)", bgColor: "rgba(124,58,237,0.06)" },
  tyler: { color: "#059669", dimColor: "#34d399", borderColor: "rgba(5,150,105,0.22)",  bgColor: "rgba(5,150,105,0.06)"  },
};

export default function PreviewDashboard() {
  const [david, setDavid] = useState<RepData>({ ...BLANK });
  const [tyler, setTyler] = useState<RepData>({ ...BLANK });
  const [target, setTarget] = useState(0);
  const [editMode, setEditMode] = useState(true);
  const [animKey, setAnimKey] = useState(0);

  function exitEdit() {
    setEditMode(false);
    setAnimKey(k => k + 1);
  }

  const totalCash  = david.cashCollected + tyler.cashCollected;
  const totalCalls = david.callsTaken    + tyler.callsTaken;
  const totalBooked = david.callsBooked  + tyler.callsBooked;
  const avgShow  = david.showRate || tyler.showRate
    ? Math.round((david.showRate + tyler.showRate) / (+(david.showRate > 0) + +(tyler.showRate > 0)))
    : 0;
  const avgClose = david.closeRate || tyler.closeRate
    ? Math.round((david.closeRate + tyler.closeRate) / (+(david.closeRate > 0) + +(tyler.closeRate > 0)))
    : 0;
  const toTarget   = Math.max(0, target - totalCash);
  const pctHit     = target > 0 ? Math.min(100, Math.round((totalCash / target) * 100)) : 0;
  const bestCloser = david.closeRate >= tyler.closeRate ? "David" : "Tyler";
  const bestSetter = david.showRate  >= tyler.showRate  ? "David" : "Tyler";

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#07080d]" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-[#13141e] bg-[#09090f]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: "#7c3aed", boxShadow: "0 0 16px rgba(124,58,237,0.5)" }}>A</div>
          <span className="text-sm font-bold text-white tracking-tight">Ascendry</span>
          <span className="text-xs text-zinc-600 font-medium">/ Sales Dashboard</span>
        </div>

        <button
          onClick={editMode ? exitEdit : () => setEditMode(true)}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all",
            editMode
              ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-600/30"
              : "bg-[#0f1018] text-zinc-400 border-[#1e2030] hover:text-zinc-200"
          )}
        >
          {editMode ? <><Check size={12} /> Save & View</> : <><Pencil size={12} /> Edit Numbers</>}
        </button>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-zinc-500 font-medium">Live</span>
        </div>
      </header>

      {/* ── Team Hero ── */}
      <div className="shrink-0 px-6 py-3 border-b border-[#13141e] bg-[#0a0b12]">
        <div className="grid grid-cols-5 divide-x divide-[#1a1b26]">
          <HeroStat label="Total Cash" value={totalCash} prefix="£" animKey={animKey} />
          <HeroStat label="Calls Booked" value={totalBooked} animKey={animKey} />
          <HeroStat label="Calls Taken" value={totalCalls} animKey={animKey} />
          <HeroStat label="Avg Show Rate" value={avgShow} suffix="%" animKey={animKey} />
          <HeroStat label="Avg Close Rate" value={avgClose} suffix="%" animKey={animKey} />
        </div>
      </div>

      {/* ── Rep Cards ── */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4 min-h-0">
        <RepCard
          name="David" data={david} onChange={p => setDavid(prev => ({ ...prev, ...p }))}
          animKey={animKey} editMode={editMode} {...REP_CONFIGS.david}
        />
        <RepCard
          name="Tyler" data={tyler} onChange={p => setTyler(prev => ({ ...prev, ...p }))}
          animKey={animKey} editMode={editMode} {...REP_CONFIGS.tyler}
        />
      </div>

      {/* ── Management Strip ── */}
      <div className="shrink-0 border-t border-[#13141e] bg-[#0a0b12] px-6 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-400">Management</span>
          <div className="flex-1 h-px bg-violet-500/15" />
        </div>
        <div className="grid grid-cols-6 gap-4 items-center">

          {/* Target input */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Revenue Target</p>
            {editMode ? (
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none">£</span>
                <input
                  type="number" min={0} defaultValue={target || ""}
                  onBlur={e => setTarget(parseFloat(e.target.value) || 0)}
                  onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  className="w-full bg-[#12131f] border border-violet-500/40 rounded-lg text-white font-bold outline-none focus:border-violet-400 text-right pr-2 pl-5 py-1 text-sm tabular-nums"
                />
              </div>
            ) : (
              <p className="text-base font-bold text-white tabular-nums">
                £{target.toLocaleString("en-GB")}
              </p>
            )}
          </div>

          {/* Collected */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Collected</p>
            <p className="text-base font-bold text-emerald-400 tabular-nums">£{totalCash.toLocaleString("en-GB")}</p>
          </div>

          {/* To target */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">To Target</p>
            <p className={cn("text-base font-bold tabular-nums", toTarget === 0 && target > 0 ? "text-emerald-400" : "text-amber-400")}>
              {target > 0 ? `£${toTarget.toLocaleString("en-GB")}` : "—"}
            </p>
          </div>

          {/* % Hit */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">% Hit</p>
            <div className="flex items-center gap-2">
              <p className={cn("text-base font-bold tabular-nums", pctHit >= 100 ? "text-emerald-400" : pctHit >= 60 ? "text-amber-400" : "text-white")}>
                {target > 0 ? `${pctHit}%` : "—"}
              </p>
              {target > 0 && (
                <div className="flex-1 h-1.5 bg-[#1a1b26] rounded-full overflow-hidden max-w-[60px]">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctHit}%`, background: pctHit >= 100 ? "#10b981" : pctHit >= 60 ? "#f59e0b" : "#7c3aed" }} />
                </div>
              )}
            </div>
          </div>

          {/* Best closer */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Top Closer</p>
            <p className="text-base font-bold text-white">{(david.closeRate > 0 || tyler.closeRate > 0) ? bestCloser : "—"}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{Math.max(david.closeRate, tyler.closeRate) > 0 ? `${Math.max(david.closeRate, tyler.closeRate)}% close rate` : ""}</p>
          </div>

          {/* Best setter */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Top Setter</p>
            <p className="text-base font-bold text-white">{(david.showRate > 0 || tyler.showRate > 0) ? bestSetter : "—"}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{Math.max(david.showRate, tyler.showRate) > 0 ? `${Math.max(david.showRate, tyler.showRate)}% show rate` : ""}</p>
          </div>

        </div>
      </div>

    </div>
  );
}
