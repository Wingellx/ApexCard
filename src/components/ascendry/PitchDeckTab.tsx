"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import {
  Maximize2, X, ChevronLeft, ChevronRight, Download,
  Check, AlertCircle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { upsertPitchDeck } from "@/app/ascendry/actions";
import type { AscendryClient, CallSession, PitchDeck } from "@/lib/ascendry-queries";

// ─── Deck state ───────────────────────────────────────────────────────────────

interface DeckState {
  id?: string;
  s1_name: string;
  s1_date: string;
  s2_lead_stat: string;
  s2_close_rate: string;
  s2_follow_up: string;
  s3_duration: string;
  s3_leads_cold: string;
  s3_close_rate: string;
  s3_revenue_left: string;
  s7_price: string;
  s7_avg_value: string;
  s7_breakeven: string;
  s7_why_pays: string;
}

function todayFormatted() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function initDeck(client: AscendryClient, sessions: CallSession[], saved: PitchDeck | null): DeckState {
  const prep = sessions.find(s => !s.outcome) ?? sessions[0] ?? null;
  return {
    id: saved?.id,
    s1_name: saved?.s1_name ?? client.name,
    s1_date: saved?.s1_date ?? todayFormatted(),
    s2_lead_stat: saved?.s2_lead_stat ?? (prep?.leads_per_week ? `${prep.leads_per_week} conversations/week` : ""),
    s2_close_rate: saved?.s2_close_rate ?? prep?.current_close_rate ?? "",
    s2_follow_up: saved?.s2_follow_up ?? prep?.follow_up_process ?? "",
    s3_duration: saved?.s3_duration ?? "",
    s3_leads_cold: saved?.s3_leads_cold ?? prep?.leads_per_week ?? "",
    s3_close_rate: saved?.s3_close_rate ?? prep?.current_close_rate ?? "",
    s3_revenue_left: saved?.s3_revenue_left ?? "",
    s7_price: saved?.s7_price ?? prep?.their_price_point ?? "",
    s7_avg_value: saved?.s7_avg_value ?? "",
    s7_breakeven: saved?.s7_breakeven ?? "",
    s7_why_pays: saved?.s7_why_pays ?? "",
  };
}

// ─── Editable field ───────────────────────────────────────────────────────────

interface EFProps {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
  light?: boolean;
}

function EF({ value, placeholder, onChange, className = "", multiline = false, light = false }: EFProps) {
  const empty = !value.trim();
  const base = `bg-transparent border-none outline-none resize-none w-full ${className}`;
  const emptyClx = light
    ? "text-amber-600 border-b border-dashed border-amber-500/60"
    : "text-amber-400 border-b border-dashed border-amber-400/50";
  const clx = `${base} ${empty ? emptyClx : ""}`;

  if (multiline) {
    return (
      <textarea
        className={clx}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
      />
    );
  }
  return (
    <input
      type="text"
      className={clx}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

// ─── Doc-view slides ──────────────────────────────────────────────────────────

const DARK = "#070c1a";
const TEAL = "#0d9488";

function SlideLabel({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Slide {n}</span>
    </div>
  );
}

// Slide 1 — Title (dark)
function DocSlide1({ d, u }: { d: DeckState; u: (p: Partial<DeckState>) => void }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-5" style={{ background: DARK }}>
        <SlideLabel n={1} />
        <div className="flex justify-between items-start mb-6">
          <span className="text-xs font-bold tracking-widest" style={{ color: TEAL }}>ASCENDRY</span>
        </div>
        <div className="mb-4">
          <div className="flex items-baseline gap-1 mb-1">
            <EF
              value={d.s1_name}
              placeholder="Client Name"
              onChange={v => u({ s1_name: v })}
              className="text-2xl font-bold text-white font-serif"
            />
            <span className="text-2xl font-bold text-white font-serif shrink-0">'s</span>
          </div>
          <p className="text-lg font-bold text-white font-serif">Sales Operating System</p>
        </div>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          A plan to turn your existing leads into consistent, predictable revenue.
        </p>
        <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: TEAL + "40" }}>
          <span className="text-xs text-slate-500">Prepared for</span>
          <EF value={d.s1_name} placeholder="Client Name" onChange={v => u({ s1_name: v })} className="text-xs text-slate-400 w-32" />
          <span className="text-slate-600">·</span>
          <EF value={d.s1_date} placeholder="Date" onChange={v => u({ s1_date: v })} className="text-xs text-slate-400 w-36" />
        </div>
      </div>
    </div>
  );
}

// Slide 2 — Where things stand (light)
function DocSlide2({ d, u }: { d: DeckState; u: (p: Partial<DeckState>) => void }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-5 bg-[#f8fafc]">
        <SlideLabel n={2} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: TEAL }}>Where Things Stand Today</p>
        <p className="text-xl font-bold text-slate-900 font-serif leading-snug mb-5">
          You don't have a leads problem.<br />You have a conversion problem.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { title: "Leads going quiet", field: "s2_lead_stat" as const, ph: "e.g. 8 conversations/week" },
            { title: "Unclear numbers", field: "s2_close_rate" as const, ph: "e.g. 20% close rate" },
            { title: "Inconsistent follow-up", field: "s2_follow_up" as const, ph: "e.g. 1 message then nothing" },
          ].map(({ title, field, ph }) => (
            <div key={field} className="rounded-lg p-3" style={{ background: DARK }}>
              <p className="text-[10px] font-semibold text-slate-400 mb-2">{title}</p>
              <EF value={d[field]} placeholder={ph} onChange={v => u({ [field]: v })} className="text-xs text-white" multiline />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Slide 3 — Cost of inaction (dark)
function DocSlide3({ d, u }: { d: DeckState; u: (p: Partial<DeckState>) => void }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-5" style={{ background: DARK }}>
        <SlideLabel n={3} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: TEAL }}>The Cost of Inaction</p>
        <div className="flex items-baseline gap-2 mb-5">
          <span className="text-sm text-slate-400">Every month this continues</span>
          <EF value={d.s3_duration} placeholder="e.g. for the past 6 months" onChange={v => u({ s3_duration: v })} className="text-sm text-slate-300 flex-1" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { stat: d.s3_leads_cold, field: "s3_leads_cold" as const, ph: "40", label: "leads going cold every month" },
            { stat: d.s3_close_rate, field: "s3_close_rate" as const, ph: "20%", label: "close rate — revenue left on every call" },
            { stat: d.s3_revenue_left, field: "s3_revenue_left" as const, ph: "£8,000", label: "in potential revenue left on the table" },
          ].map(({ field, ph, label }) => (
            <div key={field} className="border rounded-lg p-3 text-center" style={{ borderColor: TEAL + "30", background: TEAL + "08" }}>
              <EF
                value={d[field]}
                placeholder={ph}
                onChange={v => u({ [field]: v })}
                className="text-2xl font-bold text-center block"
              />
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Slide 4 — The model (light, static)
function DocSlide4() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-5 bg-[#f8fafc]">
        <SlideLabel n={4} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: TEAL }}>The Model</p>
        <p className="text-xl font-bold text-slate-900 font-serif mb-5">A three-phase system built to last.</p>
        <div className="space-y-3">
          {[
            { phase: "01", name: "Audit", timing: "Month 1", desc: "We map your entire sales process — outreach, call handling, follow-up — and identify exactly where you're losing clients and revenue." },
            { phase: "02", name: "Install", timing: "Month 1–2", desc: "We build and install your sales operating system: optimised outreach templates, a proven call framework, and an automated follow-up sequence." },
            { phase: "03", name: "Manage", timing: "Month 2–3", desc: "We manage the process with you — reviewing calls, refining messaging, tracking numbers — until the system generates consistent, predictable revenue." },
          ].map(p => (
            <div key={p.phase} className="flex gap-4 rounded-lg p-3" style={{ background: DARK }}>
              <div className="shrink-0 text-center">
                <div className="text-xs font-bold mb-0.5" style={{ color: TEAL }}>{p.phase}</div>
                <p className="text-xs text-slate-500 whitespace-nowrap">{p.timing}</p>
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">{p.name}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Slide 5 — What you get (light, static)
function DocSlide5() {
  const items = [
    "Weekly 1:1 strategy calls",
    "Full outreach system (templates, targeting, tracking)",
    "Diagnostic call framework (Call 1 & Call 2 scripts)",
    "CRM and pipeline setup",
    "Automated follow-up sequences",
    "Call recording review and feedback",
    "Monthly performance report",
    "Direct access to the Ascendry team",
    "60-day review with clear next steps",
  ];
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-5 bg-[#f8fafc]">
        <SlideLabel n={5} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: TEAL }}>What You Get</p>
        <p className="text-xl font-bold text-slate-900 font-serif mb-5">Everything you need, nothing you don't.</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center" style={{ background: TEAL + "25" }}>
                <Check size={9} style={{ color: TEAL }} />
              </div>
              <p className="text-xs text-slate-700 leading-snug">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Slide 6 — 60-day structure (dark, static)
function DocSlide6() {
  const steps = [
    { day: "Day 0", title: "Sign On", desc: "Agreement signed, kick-off call booked, platform access granted." },
    { day: "Day 10", title: "System Installed", desc: "Outreach templates live, sales process documented, CRM configured." },
    { day: "Day 30", title: "Mid-Point Review", desc: "First results reviewed, process refined, momentum confirmed." },
    { day: "Day 60", title: "Decision Point", desc: "Full system review — continue, scale, or hand off." },
  ];
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-5" style={{ background: DARK }}>
        <SlideLabel n={6} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: TEAL }}>Your 60-Day Roadmap</p>
        <p className="text-xl font-bold text-white font-serif mb-5">From signed to system in 60 days.</p>
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px" style={{ background: TEAL + "40" }} />
          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-[#070c1a]" style={{ background: TEAL }} />
                <p className="text-xs font-bold mb-0.5" style={{ color: TEAL }}>{s.day}</p>
                <p className="text-sm font-semibold text-white mb-0.5">{s.title}</p>
                <p className="text-xs text-slate-400 leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Slide 7 — Investment (light)
function DocSlide7({ d, u }: { d: DeckState; u: (p: Partial<DeckState>) => void }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-5 bg-[#f8fafc]">
        <SlideLabel n={7} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: TEAL }}>The Investment</p>
        <p className="text-xl font-bold text-slate-900 font-serif mb-4">An investment that pays for itself.</p>
        <div className="rounded-xl p-4 mb-4" style={{ background: DARK }}>
          <p className="text-xs text-slate-400 mb-1">Total investment</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white font-serif">
              <EF value={d.s7_price} placeholder="£3,000" onChange={v => u({ s7_price: v })} className="text-4xl font-bold text-white font-serif w-40" />
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg p-3 border border-slate-200">
            <p className="text-[10px] text-slate-500 mb-1">Average new client value</p>
            <EF value={d.s7_avg_value} placeholder="£2,500" onChange={v => u({ s7_avg_value: v })} className="text-base font-bold text-slate-900" light />
          </div>
          <div className="rounded-lg p-3 border border-slate-200">
            <p className="text-[10px] text-slate-500 mb-1">Clients to break even</p>
            <EF value={d.s7_breakeven} placeholder="2" onChange={v => u({ s7_breakeven: v })} className="text-base font-bold text-slate-900" light />
          </div>
        </div>
        <EF value={d.s7_why_pays} placeholder="Most clients recoup the investment within their first 30–60 days." onChange={v => u({ s7_why_pays: v })} className="text-xs text-slate-600 leading-relaxed" multiline light />
      </div>
    </div>
  );
}

// Slide 8 — Next steps (dark, static)
function DocSlide8() {
  const steps = [
    { n: "01", title: "Confirm & Pay", desc: "Agreement signed and payment processed today." },
    { n: "02", title: "Onboarding Call", desc: "Meet the team, set 90-day targets, grant access." },
    { n: "03", title: "Audit Delivered", desc: "Full diagnosis of your current sales process." },
    { n: "04", title: "Team Goes Live", desc: "System installed, outreach begins, results tracked." },
  ];
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-5" style={{ background: DARK }}>
        <SlideLabel n={8} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: TEAL }}>Next Steps</p>
        <p className="text-xl font-bold text-white font-serif mb-5">Ready to get started?</p>
        <div className="grid grid-cols-2 gap-3">
          {steps.map(s => (
            <div key={s.n} className="rounded-lg p-4 border" style={{ borderColor: TEAL + "30", background: TEAL + "08" }}>
              <p className="text-xl font-bold mb-2" style={{ color: TEAL }}>{s.n}</p>
              <p className="text-sm font-semibold text-white mb-1">{s.title}</p>
              <p className="text-xs text-slate-400 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Present-mode slides (1280×720 internal) ──────────────────────────────────

function PSlide1({ d }: { d: DeckState }) {
  return (
    <div className="w-full h-full flex flex-col justify-between p-16" style={{ background: DARK }}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold tracking-[0.25em]" style={{ color: TEAL }}>ASCENDRY</span>
        <span className="text-xs text-slate-600">{d.s1_date}</span>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-6">
          <p className="font-bold leading-none mb-2" style={{ fontSize: 60, fontFamily: "Georgia, serif", color: TEAL }}>
            {d.s1_name || "Client Name"}'s
          </p>
          <p className="font-bold leading-none" style={{ fontSize: 60, fontFamily: "Georgia, serif", color: "white" }}>
            Sales Operating System
          </p>
        </div>
        <p className="text-slate-400 max-w-lg leading-relaxed" style={{ fontSize: 22 }}>
          A plan to turn your existing leads into consistent, predictable revenue.
        </p>
      </div>
      <div className="flex items-center gap-4 pt-6 border-t" style={{ borderColor: TEAL + "40" }}>
        <span className="text-slate-500" style={{ fontSize: 14 }}>Prepared for</span>
        <span className="text-slate-300" style={{ fontSize: 14 }}>{d.s1_name || "Client Name"}</span>
        <span className="text-slate-700">·</span>
        <span className="text-slate-500" style={{ fontSize: 14 }}>{d.s1_date}</span>
      </div>
    </div>
  );
}

function PSlide2({ d }: { d: DeckState }) {
  return (
    <div className="w-full h-full flex flex-col p-16 bg-[#f8fafc]">
      <p className="text-sm font-bold tracking-widest mb-6 uppercase" style={{ color: TEAL }}>Where Things Stand Today</p>
      <p className="font-bold leading-tight mb-12 max-w-2xl" style={{ fontSize: 44, fontFamily: "Georgia, serif", color: "#0f172a" }}>
        You don't have a leads problem.<br />You have a conversion problem.
      </p>
      <div className="grid grid-cols-3 gap-6 flex-1">
        {[
          { title: "Leads Going Quiet", val: d.s2_lead_stat || "Conversations not converting" },
          { title: "Unclear Numbers", val: d.s2_close_rate || "Close rate unknown" },
          { title: "Inconsistent Follow-Up", val: d.s2_follow_up || "No systematic follow-up process" },
        ].map(c => (
          <div key={c.title} className="rounded-2xl p-8 flex flex-col justify-between" style={{ background: DARK }}>
            <p className="font-bold text-white mb-3" style={{ fontSize: 20 }}>{c.title}</p>
            <p className="text-slate-400" style={{ fontSize: 16, lineHeight: 1.5 }}>{c.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PSlide3({ d }: { d: DeckState }) {
  return (
    <div className="w-full h-full flex flex-col p-16" style={{ background: DARK }}>
      <p className="text-sm font-bold tracking-widest mb-4 uppercase" style={{ color: TEAL }}>The Cost of Inaction</p>
      <p className="text-slate-400 mb-12" style={{ fontSize: 22 }}>
        Every month this continues{d.s3_duration ? `, ${d.s3_duration}` : ""}, the gap grows.
      </p>
      <div className="grid grid-cols-3 gap-8 flex-1">
        {[
          { val: d.s3_leads_cold || "?", label: "leads going cold every month" },
          { val: d.s3_close_rate || "?", label: "close rate — revenue lost on every other call" },
          { val: d.s3_revenue_left || "?", label: "in potential revenue left on the table" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-10 text-center border flex flex-col justify-center" style={{ borderColor: TEAL + "40", background: TEAL + "0c" }}>
            <p className="font-bold mb-4" style={{ fontSize: 56, color: TEAL, fontFamily: "Georgia, serif" }}>{s.val}</p>
            <p className="text-slate-400 leading-snug" style={{ fontSize: 16 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PSlide4() {
  return (
    <div className="w-full h-full flex flex-col p-16 bg-[#f8fafc]">
      <p className="text-sm font-bold tracking-widest mb-6 uppercase" style={{ color: TEAL }}>The Model</p>
      <p className="font-bold mb-10" style={{ fontSize: 44, fontFamily: "Georgia, serif", color: "#0f172a" }}>
        A three-phase system built to last.
      </p>
      <div className="grid grid-cols-3 gap-6 flex-1">
        {[
          { phase: "01", name: "Audit", timing: "Month 1", desc: "We map your entire sales process — outreach, call handling, follow-up — and identify exactly where you're losing clients and revenue." },
          { phase: "02", name: "Install", timing: "Month 1–2", desc: "We build and install your sales operating system: optimised outreach templates, a proven call framework, and an automated follow-up sequence." },
          { phase: "03", name: "Manage", timing: "Month 2–3", desc: "We manage the process with you — reviewing calls, refining messaging, tracking numbers — until the system generates consistent, predictable revenue." },
        ].map(p => (
          <div key={p.phase} className="rounded-2xl p-8 flex flex-col" style={{ background: DARK }}>
            <p className="font-bold mb-1" style={{ fontSize: 28, color: TEAL }}>{p.phase}</p>
            <p className="font-bold text-white mb-1" style={{ fontSize: 24 }}>{p.name}</p>
            <p className="text-slate-500 text-sm mb-4">{p.timing}</p>
            <p className="text-slate-400 leading-relaxed mt-auto" style={{ fontSize: 15 }}>{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PSlide5() {
  const items = [
    "Weekly 1:1 strategy calls",
    "Full outreach system (templates, targeting, tracking)",
    "Diagnostic call framework (Call 1 & Call 2 scripts)",
    "CRM and pipeline setup",
    "Automated follow-up sequences",
    "Call recording review and feedback",
    "Monthly performance report",
    "Direct access to the Ascendry team",
    "60-day review with clear next steps",
  ];
  return (
    <div className="w-full h-full flex flex-col p-16 bg-[#f8fafc]">
      <p className="text-sm font-bold tracking-widest mb-6 uppercase" style={{ color: TEAL }}>What You Get</p>
      <p className="font-bold mb-10" style={{ fontSize: 44, fontFamily: "Georgia, serif", color: "#0f172a" }}>
        Everything you need. Nothing you don't.
      </p>
      <div className="grid grid-cols-2 gap-x-16 gap-y-5 flex-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center" style={{ background: TEAL }}>
              <Check size={14} color="white" />
            </div>
            <p className="text-slate-700" style={{ fontSize: 18 }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PSlide6() {
  const steps = [
    { day: "Day 0", title: "Sign On", desc: "Agreement signed, kick-off call booked, platform access granted." },
    { day: "Day 10", title: "System Installed", desc: "Templates live, sales process documented, CRM configured." },
    { day: "Day 30", title: "Mid-Point Review", desc: "First results reviewed, process refined, momentum confirmed." },
    { day: "Day 60", title: "Decision Point", desc: "Full system review — continue, scale, or hand off." },
  ];
  return (
    <div className="w-full h-full flex flex-col p-16" style={{ background: DARK }}>
      <p className="text-sm font-bold tracking-widest mb-6 uppercase" style={{ color: TEAL }}>Your 60-Day Roadmap</p>
      <p className="font-bold mb-10 text-white" style={{ fontSize: 44, fontFamily: "Georgia, serif" }}>
        From signed to system in 60 days.
      </p>
      <div className="flex gap-0 flex-1">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 relative flex flex-col pr-8">
            {i < steps.length - 1 && (
              <div className="absolute right-0 top-3 w-8 h-px" style={{ background: TEAL + "60" }} />
            )}
            <div className="w-6 h-6 rounded-full mb-4 flex items-center justify-center" style={{ background: TEAL }}>
              <span className="text-white font-bold" style={{ fontSize: 12 }}>{i + 1}</span>
            </div>
            <p className="font-bold mb-1" style={{ fontSize: 16, color: TEAL }}>{s.day}</p>
            <p className="font-bold text-white mb-2" style={{ fontSize: 22 }}>{s.title}</p>
            <p className="text-slate-400" style={{ fontSize: 15, lineHeight: 1.6 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PSlide7({ d }: { d: DeckState }) {
  return (
    <div className="w-full h-full flex flex-col p-16 bg-[#f8fafc]">
      <p className="text-sm font-bold tracking-widest mb-6 uppercase" style={{ color: TEAL }}>The Investment</p>
      <p className="font-bold mb-10" style={{ fontSize: 44, fontFamily: "Georgia, serif", color: "#0f172a" }}>
        An investment that pays for itself.
      </p>
      <div className="flex gap-10 flex-1">
        <div className="rounded-2xl p-10 flex flex-col justify-center" style={{ background: DARK, minWidth: 280 }}>
          <p className="text-slate-400 mb-2" style={{ fontSize: 16 }}>Total investment</p>
          <p className="font-bold text-white" style={{ fontSize: 72, fontFamily: "Georgia, serif", lineHeight: 1 }}>
            {d.s7_price || "£—"}
          </p>
        </div>
        <div className="flex flex-col justify-between flex-1">
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-xl p-6 border border-slate-200 bg-white">
              <p className="text-slate-500 mb-2" style={{ fontSize: 14 }}>Average new client value</p>
              <p className="font-bold text-slate-900" style={{ fontSize: 32, fontFamily: "Georgia, serif" }}>{d.s7_avg_value || "—"}</p>
            </div>
            <div className="rounded-xl p-6 border border-slate-200 bg-white">
              <p className="text-slate-500 mb-2" style={{ fontSize: 14 }}>Clients to break even</p>
              <p className="font-bold text-slate-900" style={{ fontSize: 32, fontFamily: "Georgia, serif" }}>{d.s7_breakeven || "—"}</p>
            </div>
          </div>
          <p className="text-slate-600" style={{ fontSize: 18, lineHeight: 1.6 }}>
            {d.s7_why_pays || "Most clients recoup the investment within their first 30–60 days."}
          </p>
        </div>
      </div>
    </div>
  );
}

function PSlide8() {
  const steps = [
    { n: "01", title: "Confirm & Pay", desc: "Agreement signed and payment processed today." },
    { n: "02", title: "Onboarding Call", desc: "Meet the team, set 90-day targets, grant access." },
    { n: "03", title: "Audit Delivered", desc: "Full diagnosis of your current sales process." },
    { n: "04", title: "Team Goes Live", desc: "System installed, outreach begins, results tracked." },
  ];
  return (
    <div className="w-full h-full flex flex-col p-16" style={{ background: DARK }}>
      <p className="text-sm font-bold tracking-widest mb-6 uppercase" style={{ color: TEAL }}>Next Steps</p>
      <p className="font-bold mb-10 text-white" style={{ fontSize: 44, fontFamily: "Georgia, serif" }}>
        Ready to get started?
      </p>
      <div className="grid grid-cols-2 gap-6 flex-1">
        {steps.map(s => (
          <div key={s.n} className="rounded-2xl p-8 border flex flex-col" style={{ borderColor: TEAL + "40", background: TEAL + "0c" }}>
            <p className="font-bold mb-3" style={{ fontSize: 36, color: TEAL, fontFamily: "Georgia, serif" }}>{s.n}</p>
            <p className="font-bold text-white mb-2" style={{ fontSize: 22 }}>{s.title}</p>
            <p className="text-slate-400" style={{ fontSize: 16, lineHeight: 1.6 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const PRESENT_SLIDES = [PSlide1, PSlide2, PSlide3, PSlide4, PSlide5, PSlide6, PSlide7, PSlide8];
const SLIDE_TITLES = [
  "Title", "Where Things Stand", "Cost of Inaction",
  "The Model", "What You Get", "60-Day Roadmap",
  "The Investment", "Next Steps",
];

// ─── Present mode ─────────────────────────────────────────────────────────────

function PresentMode({ deck, onClose }: { deck: DeckState; onClose: () => void }) {
  const [current, setCurrent] = useState(0);
  const [scale, setScale] = useState(1);
  const total = PRESENT_SLIDES.length;

  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);
  const next = useCallback(() => setCurrent(c => Math.min(total - 1, c + 1)), [total]);

  useEffect(() => {
    function calc() {
      const sw = window.innerWidth / 1280;
      const sh = window.innerHeight / 720;
      setScale(Math.min(sw, sh) * 0.95);
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); prev(); }
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  const SlideComponent = PRESENT_SLIDES[current];
  const slideWidth = 1280 * scale;
  const slideHeight = 720 * scale;

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center select-none">
      {/* Slide frame */}
      <div style={{ width: slideWidth, height: slideHeight, position: "relative", overflow: "hidden", borderRadius: 8 }}>
        <div style={{ width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute" }}>
          <SlideComponent d={deck} />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center gap-6 mt-5">
        <button
          onClick={prev}
          disabled={current === 0}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all"
              style={{ width: i === current ? 24 : 6, height: 6, background: i === current ? TEAL : "rgba(255,255,255,0.2)" }}
            />
          ))}
        </div>
        <button
          onClick={next}
          disabled={current === total - 1}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-20"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <p className="mt-2 text-white/30 text-xs">
        {current + 1} / {total} · {SLIDE_TITLES[current]}
      </p>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}

// ─── PPTX export ──────────────────────────────────────────────────────────────

async function exportToPptx(deck: DeckState) {
  const pptxgen = (await import("pptxgenjs")).default;
  const prs = new pptxgen();
  prs.layout = "LAYOUT_16x9";

  const NAVY = "070c1a";
  const TEAL_HEX = "0d9488";
  const WHITE = "ffffff";
  const SLATE = "94a3b8";
  const LIGHT_BG = "f8fafc";
  const DARK_TEXT = "0f172a";
  const MID = "475569";

  // Slide 1
  let s = prs.addSlide();
  s.background = { color: NAVY };
  s.addText("ASCENDRY", { x: 0.5, y: 0.4, w: 2, h: 0.3, fontSize: 10, bold: true, color: TEAL_HEX, charSpacing: 4 });
  s.addText(`${deck.s1_name || "Client Name"}'s\nSales Operating System`, { x: 0.5, y: 1.8, w: 8.5, h: 2, fontSize: 48, bold: true, color: WHITE, breakLine: true });
  s.addText("A plan to turn your existing leads into consistent, predictable revenue.", { x: 0.5, y: 4.0, w: 7, h: 0.8, fontSize: 18, color: SLATE });
  s.addText(`Prepared for ${deck.s1_name || "Client Name"}  ·  ${deck.s1_date}`, { x: 0.5, y: 6.3, w: 8, h: 0.4, fontSize: 12, color: SLATE });
  s.addShape(prs.ShapeType.rect, { x: 0.5, y: 6.1, w: 9, h: 0.03, fill: { color: TEAL_HEX }, line: { color: TEAL_HEX } });

  // Slide 2
  s = prs.addSlide();
  s.background = { color: LIGHT_BG };
  s.addText("WHERE THINGS STAND TODAY", { x: 0.5, y: 0.4, w: 8, h: 0.3, fontSize: 10, bold: true, color: TEAL_HEX, charSpacing: 3 });
  s.addText("You don't have a leads problem.\nYou have a conversion problem.", { x: 0.5, y: 0.9, w: 8.5, h: 1.6, fontSize: 34, bold: true, color: DARK_TEXT, breakLine: true });
  const cards2 = [
    { title: "Leads Going Quiet", val: deck.s2_lead_stat || "Conversations not converting" },
    { title: "Unclear Numbers", val: deck.s2_close_rate || "Close rate unknown" },
    { title: "Inconsistent Follow-Up", val: deck.s2_follow_up || "No follow-up process" },
  ];
  cards2.forEach((c, i) => {
    const x = 0.5 + i * 3.1;
    s.addShape(prs.ShapeType.roundRect, { x, y: 2.8, w: 2.9, h: 1.8, fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.1 });
    s.addText(c.title, { x, y: 2.9, w: 2.9, h: 0.4, fontSize: 12, bold: true, color: WHITE, align: "left", inset: 0.15 });
    s.addText(c.val, { x, y: 3.4, w: 2.9, h: 1, fontSize: 12, color: SLATE, align: "left", inset: 0.15, wrap: true });
  });

  // Slide 3
  s = prs.addSlide();
  s.background = { color: NAVY };
  s.addText("THE COST OF INACTION", { x: 0.5, y: 0.4, w: 8, h: 0.3, fontSize: 10, bold: true, color: TEAL_HEX, charSpacing: 3 });
  s.addText(`Every month this continues${deck.s3_duration ? `, ${deck.s3_duration}` : ""}, the gap grows.`, { x: 0.5, y: 0.9, w: 8.5, h: 0.6, fontSize: 18, color: SLATE });
  const stats3 = [
    { val: deck.s3_leads_cold || "?", label: "leads going cold every month" },
    { val: deck.s3_close_rate || "?", label: "close rate — revenue lost on every other call" },
    { val: deck.s3_revenue_left || "?", label: "in potential revenue left on the table" },
  ];
  stats3.forEach((st, i) => {
    const x = 0.5 + i * 3.1;
    s.addShape(prs.ShapeType.roundRect, { x, y: 1.8, w: 2.9, h: 2.8, fill: { color: TEAL_HEX + "18" }, line: { color: TEAL_HEX + "60" }, rectRadius: 0.15 });
    s.addText(st.val, { x, y: 2.2, w: 2.9, h: 1, fontSize: 44, bold: true, color: TEAL_HEX, align: "center" });
    s.addText(st.label, { x, y: 3.3, w: 2.9, h: 1, fontSize: 13, color: SLATE, align: "center", wrap: true, inset: 0.2 });
  });

  // Slide 4
  s = prs.addSlide();
  s.background = { color: LIGHT_BG };
  s.addText("THE MODEL", { x: 0.5, y: 0.4, w: 8, h: 0.3, fontSize: 10, bold: true, color: TEAL_HEX, charSpacing: 3 });
  s.addText("A three-phase system built to last.", { x: 0.5, y: 0.9, w: 8.5, h: 0.9, fontSize: 34, bold: true, color: DARK_TEXT });
  const phases = [
    { phase: "01", name: "Audit", timing: "Month 1", desc: "Map your entire sales process and identify exactly where you're losing clients and revenue." },
    { phase: "02", name: "Install", timing: "Month 1–2", desc: "Build and install your sales OS: outreach templates, call framework, and follow-up sequences." },
    { phase: "03", name: "Manage", timing: "Month 2–3", desc: "Manage the process with you until the system generates consistent, predictable revenue." },
  ];
  phases.forEach((p, i) => {
    const x = 0.5 + i * 3.1;
    s.addShape(prs.ShapeType.roundRect, { x, y: 2.1, w: 2.9, h: 2.5, fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.12 });
    s.addText(p.phase, { x, y: 2.2, w: 2.9, h: 0.5, fontSize: 22, bold: true, color: TEAL_HEX, align: "left", inset: 0.2 });
    s.addText(p.name, { x, y: 2.7, w: 2.9, h: 0.4, fontSize: 18, bold: true, color: WHITE, align: "left", inset: 0.2 });
    s.addText(p.timing, { x, y: 3.1, w: 2.9, h: 0.3, fontSize: 12, color: SLATE, align: "left", inset: 0.2 });
    s.addText(p.desc, { x, y: 3.5, w: 2.9, h: 1, fontSize: 12, color: SLATE, align: "left", inset: 0.2, wrap: true });
  });

  // Slide 5
  s = prs.addSlide();
  s.background = { color: LIGHT_BG };
  s.addText("WHAT YOU GET", { x: 0.5, y: 0.4, w: 8, h: 0.3, fontSize: 10, bold: true, color: TEAL_HEX, charSpacing: 3 });
  s.addText("Everything you need. Nothing you don't.", { x: 0.5, y: 0.9, w: 8.5, h: 0.9, fontSize: 34, bold: true, color: DARK_TEXT });
  const items5 = ["Weekly 1:1 strategy calls", "Full outreach system", "Diagnostic call framework", "CRM and pipeline setup", "Automated follow-up sequences", "Call recording review and feedback", "Monthly performance report", "Direct access to the Ascendry team", "60-day review with clear next steps"];
  items5.forEach((item, i) => {
    const col = i < 5 ? 0 : 1;
    const row = i < 5 ? i : i - 5;
    const x = 0.5 + col * 4.7;
    const y = 2.2 + row * 0.5;
    s.addShape(prs.ShapeType.ellipse, { x: x, y: y + 0.04, w: 0.28, h: 0.28, fill: { color: TEAL_HEX }, line: { color: TEAL_HEX } });
    s.addText("✓", { x: x - 0.01, y: y + 0.02, w: 0.3, h: 0.3, fontSize: 10, bold: true, color: WHITE, align: "center" });
    s.addText(item, { x: x + 0.4, y, w: 4, h: 0.36, fontSize: 14, color: MID });
  });

  // Slide 6
  s = prs.addSlide();
  s.background = { color: NAVY };
  s.addText("YOUR 60-DAY ROADMAP", { x: 0.5, y: 0.4, w: 8, h: 0.3, fontSize: 10, bold: true, color: TEAL_HEX, charSpacing: 3 });
  s.addText("From signed to system in 60 days.", { x: 0.5, y: 0.9, w: 8.5, h: 0.9, fontSize: 34, bold: true, color: WHITE });
  const timeline = [
    { day: "Day 0", title: "Sign On", desc: "Agreement signed, kick-off call booked, access granted." },
    { day: "Day 10", title: "System Installed", desc: "Templates live, process documented, CRM configured." },
    { day: "Day 30", title: "Mid-Point Review", desc: "First results reviewed, process refined." },
    { day: "Day 60", title: "Decision Point", desc: "Full review — continue, scale, or hand off." },
  ];
  timeline.forEach((t, i) => {
    const x = 0.5 + i * 2.3;
    s.addText(t.day, { x, y: 2.2, w: 2.1, h: 0.35, fontSize: 13, bold: true, color: TEAL_HEX });
    s.addText(t.title, { x, y: 2.55, w: 2.1, h: 0.45, fontSize: 18, bold: true, color: WHITE });
    s.addText(t.desc, { x, y: 3.05, w: 2.1, h: 1.2, fontSize: 13, color: SLATE, wrap: true });
  });

  // Slide 7
  s = prs.addSlide();
  s.background = { color: LIGHT_BG };
  s.addText("THE INVESTMENT", { x: 0.5, y: 0.4, w: 8, h: 0.3, fontSize: 10, bold: true, color: TEAL_HEX, charSpacing: 3 });
  s.addText("An investment that pays for itself.", { x: 0.5, y: 0.9, w: 8.5, h: 0.9, fontSize: 34, bold: true, color: DARK_TEXT });
  s.addShape(prs.ShapeType.roundRect, { x: 0.5, y: 2.1, w: 3.5, h: 2.8, fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.15 });
  s.addText("Total investment", { x: 0.5, y: 2.4, w: 3.5, h: 0.4, fontSize: 14, color: SLATE, align: "left", inset: 0.3 });
  s.addText(deck.s7_price || "£—", { x: 0.5, y: 2.9, w: 3.5, h: 1.2, fontSize: 56, bold: true, color: WHITE, align: "left", inset: 0.3 });
  s.addShape(prs.ShapeType.roundRect, { x: 4.3, y: 2.1, w: 2.2, h: 1.3, fill: { color: WHITE }, line: { color: "e2e8f0" }, rectRadius: 0.1 });
  s.addText("Average client value", { x: 4.3, y: 2.2, w: 2.2, h: 0.35, fontSize: 12, color: MID, inset: 0.15 });
  s.addText(deck.s7_avg_value || "—", { x: 4.3, y: 2.6, w: 2.2, h: 0.6, fontSize: 26, bold: true, color: DARK_TEXT, inset: 0.15 });
  s.addShape(prs.ShapeType.roundRect, { x: 6.7, y: 2.1, w: 2.2, h: 1.3, fill: { color: WHITE }, line: { color: "e2e8f0" }, rectRadius: 0.1 });
  s.addText("Clients to break even", { x: 6.7, y: 2.2, w: 2.2, h: 0.35, fontSize: 12, color: MID, inset: 0.15 });
  s.addText(deck.s7_breakeven || "—", { x: 6.7, y: 2.6, w: 2.2, h: 0.6, fontSize: 26, bold: true, color: DARK_TEXT, inset: 0.15 });
  s.addText(deck.s7_why_pays || "Most clients recoup the investment within their first 30–60 days.", { x: 4.3, y: 3.6, w: 4.7, h: 1, fontSize: 15, color: MID, wrap: true });

  // Slide 8
  s = prs.addSlide();
  s.background = { color: NAVY };
  s.addText("NEXT STEPS", { x: 0.5, y: 0.4, w: 8, h: 0.3, fontSize: 10, bold: true, color: TEAL_HEX, charSpacing: 3 });
  s.addText("Ready to get started?", { x: 0.5, y: 0.9, w: 8.5, h: 0.9, fontSize: 34, bold: true, color: WHITE });
  const steps8 = [
    { n: "01", title: "Confirm & Pay", desc: "Agreement signed and payment processed today." },
    { n: "02", title: "Onboarding Call", desc: "Meet the team, set 90-day targets, grant access." },
    { n: "03", title: "Audit Delivered", desc: "Full diagnosis of your current sales process." },
    { n: "04", title: "Team Goes Live", desc: "System installed, outreach begins, results tracked." },
  ];
  steps8.forEach((st, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.7;
    const y = 2.2 + row * 2.1;
    s.addShape(prs.ShapeType.roundRect, { x, y, w: 4.4, h: 1.9, fill: { color: TEAL_HEX + "18" }, line: { color: TEAL_HEX + "60" }, rectRadius: 0.15 });
    s.addText(st.n, { x, y: y + 0.15, w: 4.4, h: 0.55, fontSize: 28, bold: true, color: TEAL_HEX, inset: 0.25 });
    s.addText(st.title, { x, y: y + 0.7, w: 4.4, h: 0.4, fontSize: 18, bold: true, color: WHITE, inset: 0.25 });
    s.addText(st.desc, { x, y: y + 1.1, w: 4.4, h: 0.6, fontSize: 13, color: SLATE, inset: 0.25, wrap: true });
  });

  await prs.writeFile({ fileName: `Ascendry — ${deck.s1_name || "Pitch Deck"}.pptx` });
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PitchDeckTabProps {
  client: AscendryClient;
  sessions: CallSession[];
  savedDeck: PitchDeck | null;
}

export default function PitchDeckTab({ client, sessions, savedDeck }: PitchDeckTabProps) {
  const [deck, setDeck] = useState<DeckState>(() => initDeck(client, sessions, savedDeck));
  const [presenting, setPresenting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [exporting, setExporting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback((data: DeckState) => {
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await upsertPitchDeck({
          id: data.id,
          client_id: client.id,
          s1_name: data.s1_name || null,
          s1_date: data.s1_date || null,
          s2_lead_stat: data.s2_lead_stat || null,
          s2_close_rate: data.s2_close_rate || null,
          s2_follow_up: data.s2_follow_up || null,
          s3_duration: data.s3_duration || null,
          s3_leads_cold: data.s3_leads_cold || null,
          s3_close_rate: data.s3_close_rate || null,
          s3_revenue_left: data.s3_revenue_left || null,
          s7_price: data.s7_price || null,
          s7_avg_value: data.s7_avg_value || null,
          s7_breakeven: data.s7_breakeven || null,
          s7_why_pays: data.s7_why_pays || null,
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      });
    }, 1200);
  }, [client.id]);

  function update(patch: Partial<DeckState>) {
    const updated = { ...deck, ...patch };
    setDeck(updated);
    scheduleSave(updated);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportToPptx(deck);
    } finally {
      setExporting(false);
    }
  }

  const anyEmpty = !deck.s1_name || !deck.s7_price;

  return (
    <>
      {presenting && <PresentMode deck={deck} onClose={() => setPresenting(false)} />}

      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2130] bg-[#0d0e14] shrink-0">
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && <span className="text-xs text-zinc-500">Saving…</span>}
            {saveStatus === "saved" && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check size={10} />Saved</span>}
            {anyEmpty && saveStatus === "idle" && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <AlertCircle size={11} />
                Some fields need filling
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-[#1e2130] hover:border-zinc-600 transition-colors disabled:opacity-40"
            >
              <Download size={12} />
              {exporting ? "Exporting…" : "Export .pptx"}
            </button>
            <button
              onClick={() => setPresenting(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white border transition-colors"
              style={{ background: TEAL, borderColor: TEAL }}
            >
              <Maximize2 size={12} />
              Present
            </button>
          </div>
        </div>

        {/* Slides in doc view */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <DocSlide1 d={deck} u={update} />
          <DocSlide2 d={deck} u={update} />
          <DocSlide3 d={deck} u={update} />
          <DocSlide4 />
          <DocSlide5 />
          <DocSlide6 />
          <DocSlide7 d={deck} u={update} />
          <DocSlide8 />
        </div>
      </div>
    </>
  );
}
