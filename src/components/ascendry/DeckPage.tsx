"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import {
  Maximize2, X, ChevronLeft, ChevronRight, Download, Check, ChevronDown,
} from "lucide-react";
import { upsertPitchDeck } from "@/app/ascendry/actions";
import type { AscendryClient, CallSession, PitchDeck } from "@/lib/ascendry-queries";

// ─── Constants ────────────────────────────────────────────────────────────────

const DARK = "#070c1a";
const TEAL = "#0d9488";

// ─── Deck state ───────────────────────────────────────────────────────────────

interface DeckState {
  id?: string;
  s1_name: string;
  s1_date: string;
  // Slide 2 — their situation
  s2_lead_stat: string;   // what they sell / their offer
  s2_close_rate: string;  // their lead flow & close rate
  s2_follow_up: string;   // follow-up / where they drop off
  // Slide 3 — the numbers
  s3_duration: string;
  s3_leads_cold: string;
  s3_close_rate: string;
  s3_revenue_left: string;
  // Slide 7 — investment
  s7_price: string;
  s7_avg_value: string;
  s7_breakeven: string;
  s7_why_pays: string;
}

const EMPTY_DECK: DeckState = {
  s1_name: "", s1_date: "", s2_lead_stat: "", s2_close_rate: "",
  s2_follow_up: "", s3_duration: "", s3_leads_cold: "", s3_close_rate: "",
  s3_revenue_left: "", s7_price: "", s7_avg_value: "", s7_breakeven: "", s7_why_pays: "",
};

function today() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function initDeck(client: AscendryClient, sessions: CallSession[], saved: PitchDeck | null): DeckState {
  const prep = sessions.find(s => !s.outcome) ?? sessions[0] ?? null;
  return {
    id: saved?.id,
    s1_name: saved?.s1_name ?? client.name,
    s1_date: saved?.s1_date ?? today(),
    s2_lead_stat: saved?.s2_lead_stat ?? prep?.their_offer ?? "",
    s2_close_rate: saved?.s2_close_rate ?? (
      prep?.leads_per_week && prep?.current_close_rate
        ? `${prep.leads_per_week} conversations/week, closing at ${prep.current_close_rate}%`
        : prep?.leads_per_week ?? prep?.current_close_rate ?? ""
    ),
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
  darkBg?: boolean;
}

function EF({ value, placeholder, onChange, className = "", multiline = false, darkBg = false }: EFProps) {
  const empty = !value.trim();
  const emptyStyle = darkBg
    ? "text-amber-400 border-b border-dashed border-amber-400/50"
    : "text-amber-600 border-b border-dashed border-amber-500/60";
  const base = `bg-transparent border-none outline-none resize-none w-full ${empty ? emptyStyle : ""} ${className}`;

  if (multiline) {
    return (
      <textarea className={base} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={2} />
    );
  }
  return (
    <input type="text" className={base} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} />
  );
}

// ─── Doc-view slides ──────────────────────────────────────────────────────────

function SlideBadge({ n }: { n: number }) {
  return (
    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3">Slide {n}</p>
  );
}

// 1 — Cover
function DocSlide1({ d, u }: { d: DeckState; u: (p: Partial<DeckState>) => void }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-7" style={{ background: DARK }}>
        <SlideBadge n={1} />
        <div className="flex items-center justify-between mb-10">
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: TEAL }}>Ascendry</span>
          <EF value={d.s1_date} placeholder={today()} onChange={v => u({ s1_date: v })}
            className="text-xs text-right text-zinc-500 w-36" darkBg />
        </div>
        <div className="mb-8">
          <EF value={d.s1_name} placeholder="Client name"
            onChange={v => u({ s1_name: v })}
            className="text-4xl font-bold text-white leading-none mb-0"
            darkBg />
        </div>
        <p className="text-sm text-zinc-500 border-t border-zinc-800 pt-4">Private &amp; Confidential</p>
      </div>
    </div>
  );
}

// 2 — Their situation
function DocSlide2({ d, u }: { d: DeckState; u: (p: Partial<DeckState>) => void }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-6 bg-[#f8fafc]">
        <SlideBadge n={2} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: TEAL }}>
          Where you're at right now
        </p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { field: "s2_lead_stat" as const, title: "What you're selling", ph: "e.g. online coaching for PT clients" },
            { field: "s2_close_rate" as const, title: "Your lead flow", ph: "e.g. 6 calls/week, closing at 2/10" },
            { field: "s2_follow_up" as const, title: "Where things drop off", ph: "e.g. most people ghost after 1 message" },
          ] as const).map(({ field, title, ph }) => (
            <div key={field} className="rounded-lg p-3" style={{ background: DARK }}>
              <p className="text-[10px] font-semibold text-zinc-500 mb-2">{title}</p>
              <EF value={d[field]} placeholder={ph} onChange={v => u({ [field]: v })}
                className="text-xs text-zinc-200 leading-relaxed" multiline darkBg />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3 — The numbers
function DocSlide3({ d, u }: { d: DeckState; u: (p: Partial<DeckState>) => void }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-6" style={{ background: DARK }}>
        <SlideBadge n={3} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: TEAL }}>
          What the numbers look like
        </p>
        <div className="flex items-baseline gap-2 mb-5 text-sm text-zinc-400">
          <span>Every month</span>
          <EF value={d.s3_duration} placeholder="e.g. for the last 3 months"
            onChange={v => u({ s3_duration: v })} className="flex-1 text-sm text-zinc-300" darkBg />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {([
            { field: "s3_leads_cold" as const, ph: "40", label: "leads going cold every month" },
            { field: "s3_close_rate" as const, ph: "20%", label: "close rate — leaving money on every call" },
            { field: "s3_revenue_left" as const, ph: "£6,000", label: "in potential revenue not being collected" },
          ] as const).map(({ field, ph, label }) => (
            <div key={field} className="border rounded-lg p-4 text-center"
              style={{ borderColor: TEAL + "30", background: TEAL + "08" }}>
              <EF value={d[field]} placeholder={ph} onChange={v => u({ [field]: v })}
                className={`text-2xl font-bold text-center block mb-1${d[field] ? " !text-teal-400" : ""}`}
                darkBg />
              <p className="text-[10px] text-zinc-400 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 4 — How this works (static)
function DocSlide4() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-6 bg-[#f8fafc]">
        <SlideBadge n={4} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: TEAL }}>How this works</p>
        <div className="space-y-3">
          {[
            { n: "01", name: "Audit", timing: "Month 1", desc: "We go through your entire process — outreach, calls, follow-up — and work out exactly where you're losing people." },
            { n: "02", name: "Install", timing: "Month 1–2", desc: "We build out the system: the outreach templates, the call framework, and the follow-up sequences. All of it set up and tested." },
            { n: "03", name: "Manage", timing: "Month 2–3", desc: "We stay in it with you — reviewing calls, tightening the messaging, watching the numbers — until it's running the way it should." },
          ].map(p => (
            <div key={p.n} className="flex gap-4 rounded-lg p-3" style={{ background: DARK }}>
              <div className="shrink-0 text-center w-10">
                <div className="text-xs font-bold mb-0.5" style={{ color: TEAL }}>{p.n}</div>
                <p className="text-[10px] text-zinc-600 whitespace-nowrap">{p.timing}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">{p.name}</p>
                <p className="text-xs text-zinc-400 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 5 — What you're getting (static)
function DocSlide5() {
  const items = [
    "Weekly 1:1 strategy calls",
    "Outreach system — templates, targeting, tracking",
    "Call 1 and Call 2 frameworks",
    "CRM and pipeline setup",
    "Automated follow-up sequences",
    "Call recording review and written feedback",
    "Monthly numbers review",
    "Direct access to the Ascendry team",
    "60-day check-in with a clear next step",
  ];
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-6 bg-[#f8fafc]">
        <SlideBadge n={5} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: TEAL }}>What you're getting</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center" style={{ background: TEAL + "20" }}>
                <Check size={9} style={{ color: TEAL }} />
              </div>
              <p className="text-xs text-zinc-600 leading-snug">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 6 — Timeline (static)
function DocSlide6() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-6" style={{ background: DARK }}>
        <SlideBadge n={6} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: TEAL }}>Your first 60 days</p>
        <div className="relative pl-6">
          <div className="absolute left-2 top-1 bottom-1 w-px" style={{ background: TEAL + "35" }} />
          <div className="space-y-5">
            {[
              { day: "Day 0", title: "You're in", desc: "Agreement signed, kick-off call booked, access to everything set up." },
              { day: "Day 10", title: "System built", desc: "Outreach templates live, call process documented, CRM ready to go." },
              { day: "Day 30", title: "Check-in", desc: "We go through the numbers together — what's working, what we're adjusting." },
              { day: "Day 60", title: "Review", desc: "Full picture of where you've landed — and a clear decision on what comes next." },
            ].map(s => (
              <div key={s.day} className="relative">
                <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full" style={{ background: TEAL }} />
                <p className="text-[11px] font-semibold mb-0.5" style={{ color: TEAL }}>{s.day}</p>
                <p className="text-sm font-medium text-white mb-0.5">{s.title}</p>
                <p className="text-xs text-zinc-400 leading-snug">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 7 — Investment
function DocSlide7({ d, u }: { d: DeckState; u: (p: Partial<DeckState>) => void }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-6 bg-[#f8fafc]">
        <SlideBadge n={7} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: TEAL }}>The investment</p>
        <div className="flex gap-4 items-start">
          <div className="rounded-xl p-5 shrink-0" style={{ background: DARK, minWidth: 180 }}>
            <p className="text-xs text-zinc-500 mb-2">Total</p>
            <EF value={d.s7_price} placeholder="£3,000" onChange={v => u({ s7_price: v })}
              className="text-3xl font-bold text-white" darkBg />
          </div>
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3 border border-zinc-200">
                <p className="text-[10px] text-zinc-500 mb-1">Average client value</p>
                <EF value={d.s7_avg_value} placeholder="£2,500" onChange={v => u({ s7_avg_value: v })}
                  className="text-base font-semibold text-zinc-900" />
              </div>
              <div className="rounded-lg p-3 border border-zinc-200">
                <p className="text-[10px] text-zinc-500 mb-1">Clients to break even</p>
                <EF value={d.s7_breakeven} placeholder="2" onChange={v => u({ s7_breakeven: v })}
                  className="text-base font-semibold text-zinc-900" />
              </div>
            </div>
            <EF value={d.s7_why_pays} placeholder="e.g. Most people close their first extra client within the first 3–4 weeks."
              onChange={v => u({ s7_why_pays: v })}
              className="text-xs text-zinc-500 leading-relaxed" multiline />
          </div>
        </div>
      </div>
    </div>
  );
}

// 8 — Next steps (static)
function DocSlide8() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e2130]">
      <div className="px-6 pt-6 pb-6" style={{ background: DARK }}>
        <SlideBadge n={8} />
        <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: TEAL }}>If you're in</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { n: "01", title: "Agreement signed", desc: "We send it over today. Takes 5 minutes." },
            { n: "02", title: "Kick-off call booked", desc: "Usually within 48 hours of signing." },
            { n: "03", title: "Audit delivered", desc: "We go through your full process together." },
            { n: "04", title: "Work starts", desc: "Outreach live, CRM set up, calls tracked." },
          ].map(s => (
            <div key={s.n} className="rounded-lg p-4 border" style={{ borderColor: TEAL + "30", background: TEAL + "08" }}>
              <p className="text-xl font-bold mb-1" style={{ color: TEAL }}>{s.n}</p>
              <p className="text-sm font-semibold text-white mb-0.5">{s.title}</p>
              <p className="text-xs text-zinc-400 leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Present-mode slides (rendered at 1280×720 then scaled) ───────────────────

function empty(v: string, fallback?: string) {
  return v.trim() ? v : (fallback ?? "");
}

function PSlide1({ d }: { d: DeckState }) {
  return (
    <div className="w-full h-full flex flex-col justify-between p-16" style={{ background: DARK }}>
      <div className="flex justify-between items-start">
        <span className="text-sm font-bold tracking-[0.25em] uppercase" style={{ color: TEAL }}>Ascendry</span>
        <span className="text-sm text-zinc-600">{d.s1_date}</span>
      </div>
      <div>
        <p className="font-bold text-white leading-none" style={{ fontSize: 72, fontFamily: "Georgia, serif" }}>
          {empty(d.s1_name)}
        </p>
      </div>
      <p className="text-sm text-zinc-600 border-t border-zinc-800 pt-4">Private &amp; Confidential</p>
    </div>
  );
}

function PSlide2({ d }: { d: DeckState }) {
  return (
    <div className="w-full h-full flex flex-col p-16 bg-[#f8fafc]">
      <p className="text-sm font-bold tracking-widest mb-12 uppercase" style={{ color: TEAL }}>
        Where you&apos;re at right now
      </p>
      <div className="grid grid-cols-3 gap-8 flex-1">
        {[
          { title: "What you're selling", val: d.s2_lead_stat },
          { title: "Your lead flow", val: d.s2_close_rate },
          { title: "Where things drop off", val: d.s2_follow_up },
        ].map(c => (
          <div key={c.title} className="rounded-2xl p-8 flex flex-col" style={{ background: DARK }}>
            <p className="font-semibold text-zinc-400 mb-4" style={{ fontSize: 16 }}>{c.title}</p>
            <p className="text-white leading-snug mt-auto" style={{ fontSize: 18 }}>{empty(c.val)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PSlide3({ d }: { d: DeckState }) {
  return (
    <div className="w-full h-full flex flex-col p-16" style={{ background: DARK }}>
      <p className="text-sm font-bold tracking-widest mb-4 uppercase" style={{ color: TEAL }}>
        What the numbers look like
      </p>
      {d.s3_duration && (
        <p className="text-zinc-400 mb-10" style={{ fontSize: 18 }}>{d.s3_duration}</p>
      )}
      <div className="grid grid-cols-3 gap-8 flex-1">
        {[
          { val: d.s3_leads_cold, label: "leads going cold every month" },
          { val: d.s3_close_rate, label: "close rate" },
          { val: d.s3_revenue_left, label: "in revenue not being collected" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-10 text-center border flex flex-col justify-center"
            style={{ borderColor: TEAL + "40", background: TEAL + "0c" }}>
            <p className="font-bold mb-4 leading-none" style={{ fontSize: 56, color: TEAL }}>
              {empty(s.val)}
            </p>
            <p className="text-zinc-400" style={{ fontSize: 15 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PSlide4() {
  return (
    <div className="w-full h-full flex flex-col p-16 bg-[#f8fafc]">
      <p className="text-sm font-bold tracking-widest mb-12 uppercase" style={{ color: TEAL }}>How this works</p>
      <div className="grid grid-cols-3 gap-8 flex-1">
        {[
          { n: "01", name: "Audit", timing: "Month 1", desc: "We go through your entire process and work out exactly where you're losing people." },
          { n: "02", name: "Install", timing: "Month 1–2", desc: "We build out the system — outreach templates, call framework, follow-up sequences. All of it." },
          { n: "03", name: "Manage", timing: "Month 2–3", desc: "We stay in it with you — reviewing calls, watching the numbers — until it runs properly." },
        ].map(p => (
          <div key={p.n} className="rounded-2xl p-10 flex flex-col" style={{ background: DARK }}>
            <p className="font-bold mb-1" style={{ fontSize: 28, color: TEAL }}>{p.n}</p>
            <p className="font-bold text-white mb-1" style={{ fontSize: 26 }}>{p.name}</p>
            <p className="text-zinc-500 mb-5" style={{ fontSize: 13 }}>{p.timing}</p>
            <p className="text-zinc-400 leading-relaxed mt-auto" style={{ fontSize: 15 }}>{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PSlide5() {
  const items = [
    "Weekly 1:1 strategy calls",
    "Outreach system — templates, targeting, tracking",
    "Call 1 and Call 2 frameworks",
    "CRM and pipeline setup",
    "Automated follow-up sequences",
    "Call recording review and written feedback",
    "Monthly numbers review",
    "Direct access to the Ascendry team",
    "60-day check-in with a clear next step",
  ];
  return (
    <div className="w-full h-full flex flex-col p-16 bg-[#f8fafc]">
      <p className="text-sm font-bold tracking-widest mb-12 uppercase" style={{ color: TEAL }}>
        What you&apos;re getting
      </p>
      <div className="grid grid-cols-2 gap-x-16 gap-y-6 flex-1 content-start">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center" style={{ background: TEAL }}>
              <Check size={13} color="white" />
            </div>
            <p className="text-slate-700" style={{ fontSize: 18 }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PSlide6() {
  return (
    <div className="w-full h-full flex flex-col p-16" style={{ background: DARK }}>
      <p className="text-sm font-bold tracking-widest mb-12 uppercase" style={{ color: TEAL }}>
        Your first 60 days
      </p>
      <div className="flex gap-0 flex-1">
        {[
          { day: "Day 0", title: "You're in", desc: "Agreement signed, kick-off call booked, access set up." },
          { day: "Day 10", title: "System built", desc: "Outreach live, call process documented, CRM ready." },
          { day: "Day 30", title: "Check-in", desc: "Go through the numbers — what's working, what we're adjusting." },
          { day: "Day 60", title: "Review", desc: "Full picture of where you've landed, and what comes next." },
        ].map((s, i) => (
          <div key={i} className="flex-1 relative flex flex-col pr-8">
            {i < 3 && (
              <div className="absolute right-0 top-3 w-8 h-px" style={{ background: TEAL + "50" }} />
            )}
            <div className="w-6 h-6 rounded-full mb-5 flex items-center justify-center shrink-0" style={{ background: TEAL }}>
              <span className="text-white font-bold" style={{ fontSize: 12 }}>{i + 1}</span>
            </div>
            <p className="font-semibold mb-1" style={{ fontSize: 15, color: TEAL }}>{s.day}</p>
            <p className="font-bold text-white mb-2" style={{ fontSize: 22 }}>{s.title}</p>
            <p className="text-zinc-400 leading-relaxed" style={{ fontSize: 14 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PSlide7({ d }: { d: DeckState }) {
  return (
    <div className="w-full h-full flex flex-col p-16 bg-[#f8fafc]">
      <p className="text-sm font-bold tracking-widest mb-12 uppercase" style={{ color: TEAL }}>The investment</p>
      <div className="flex gap-10 flex-1">
        <div className="rounded-2xl p-12 flex flex-col justify-center shrink-0" style={{ background: DARK, minWidth: 300 }}>
          <p className="text-zinc-400 mb-3" style={{ fontSize: 16 }}>Total</p>
          <p className="font-bold text-white leading-none" style={{ fontSize: 72, fontFamily: "Georgia, serif" }}>
            {empty(d.s7_price)}
          </p>
        </div>
        <div className="flex flex-col justify-between flex-1">
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-xl p-6 border border-slate-200 bg-white">
              <p className="text-slate-500 mb-2" style={{ fontSize: 14 }}>Average client value</p>
              <p className="font-bold text-slate-900" style={{ fontSize: 32 }}>{empty(d.s7_avg_value)}</p>
            </div>
            <div className="rounded-xl p-6 border border-slate-200 bg-white">
              <p className="text-slate-500 mb-2" style={{ fontSize: 14 }}>Clients to break even</p>
              <p className="font-bold text-slate-900" style={{ fontSize: 32 }}>{empty(d.s7_breakeven)}</p>
            </div>
          </div>
          {d.s7_why_pays && (
            <p className="text-slate-600" style={{ fontSize: 18, lineHeight: 1.6 }}>{d.s7_why_pays}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PSlide8() {
  return (
    <div className="w-full h-full flex flex-col p-16" style={{ background: DARK }}>
      <p className="text-sm font-bold tracking-widest mb-12 uppercase" style={{ color: TEAL }}>If you&apos;re in</p>
      <div className="grid grid-cols-2 gap-8 flex-1">
        {[
          { n: "01", title: "Agreement signed", desc: "We send it over today. Takes 5 minutes." },
          { n: "02", title: "Kick-off call booked", desc: "Usually within 48 hours of signing." },
          { n: "03", title: "Audit delivered", desc: "We go through your full process together." },
          { n: "04", title: "Work starts", desc: "Outreach live, CRM set up, calls tracked." },
        ].map(s => (
          <div key={s.n} className="rounded-2xl p-10 border flex flex-col"
            style={{ borderColor: TEAL + "40", background: TEAL + "0c" }}>
            <p className="font-bold mb-3" style={{ fontSize: 40, color: TEAL }}>{s.n}</p>
            <p className="font-bold text-white mb-2" style={{ fontSize: 22 }}>{s.title}</p>
            <p className="text-zinc-400" style={{ fontSize: 15 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const PRESENT_SLIDES = [PSlide1, PSlide2, PSlide3, PSlide4, PSlide5, PSlide6, PSlide7, PSlide8];
const SLIDE_TITLES = [
  "Cover", "Right now", "The numbers", "How it works",
  "What you get", "60-day plan", "Investment", "Next steps",
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
      setScale(Math.min(window.innerWidth / 1280, window.innerHeight / 720) * 0.95);
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (["ArrowRight", "ArrowDown", " "].includes(e.key)) { e.preventDefault(); next(); }
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); prev(); }
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  const SlideComponent = PRESENT_SLIDES[current];

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center select-none">
      <div style={{ width: 1280 * scale, height: 720 * scale, position: "relative", overflow: "hidden", borderRadius: 8 }}>
        <div style={{ width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute" }}>
          <SlideComponent d={deck} />
        </div>
      </div>

      <div className="flex items-center gap-5 mt-5">
        <button onClick={prev} disabled={current === 0}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition disabled:opacity-20">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className="rounded-full transition-all"
              style={{ width: i === current ? 24 : 6, height: 6, background: i === current ? TEAL : "rgba(255,255,255,0.18)" }}
            />
          ))}
        </div>
        <button onClick={next} disabled={current === total - 1}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition disabled:opacity-20">
          <ChevronRight size={20} />
        </button>
      </div>

      <p className="mt-2 text-white/25 text-xs">{current + 1} / {total} · {SLIDE_TITLES[current]}</p>

      <button onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition">
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
  const T = "0d9488";
  const WHITE = "ffffff";
  const Z4 = "94a3b8";
  const Z6 = "475569";
  const Z8 = "1e293b";
  const LIGHT = "f8fafc";
  const Z9 = "0f172a";

  // 1 — Cover
  let s = prs.addSlide();
  s.background = { color: NAVY };
  s.addText("ASCENDRY", { x: 0.6, y: 0.5, w: 3, h: 0.3, fontSize: 10, bold: true, color: T, charSpacing: 5 });
  s.addText(deck.s1_date, { x: 6.5, y: 0.5, w: 3, h: 0.3, fontSize: 10, color: "4b5563", align: "right" });
  s.addText(empty(deck.s1_name), { x: 0.6, y: 2.5, w: 8.8, h: 1.8, fontSize: 64, bold: true, color: WHITE });
  s.addShape(prs.ShapeType.rect, { x: 0.6, y: 6.2, w: 8.8, h: 0.03, fill: { color: Z8 }, line: { color: Z8 } });
  s.addText("Private & Confidential", { x: 0.6, y: 6.35, w: 5, h: 0.35, fontSize: 11, color: "4b5563" });

  // 2 — Right now
  s = prs.addSlide();
  s.background = { color: LIGHT };
  s.addText("WHERE YOU'RE AT RIGHT NOW", { x: 0.6, y: 0.5, w: 8.8, h: 0.3, fontSize: 10, bold: true, color: T, charSpacing: 3 });
  const cards2 = [
    { title: "What you're selling", val: deck.s2_lead_stat },
    { title: "Your lead flow", val: deck.s2_close_rate },
    { title: "Where things drop off", val: deck.s2_follow_up },
  ];
  cards2.forEach((c, i) => {
    const x = 0.6 + i * 3.1;
    s.addShape(prs.ShapeType.roundRect, { x, y: 1.4, w: 2.9, h: 3.2, fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.12 });
    s.addText(c.title, { x, y: 1.55, w: 2.9, h: 0.4, fontSize: 12, color: Z4, inset: 0.18 });
    s.addText(empty(c.val), { x, y: 2.1, w: 2.9, h: 2.2, fontSize: 14, color: WHITE, inset: 0.18, wrap: true });
  });

  // 3 — Numbers
  s = prs.addSlide();
  s.background = { color: NAVY };
  s.addText("WHAT THE NUMBERS LOOK LIKE", { x: 0.6, y: 0.5, w: 8.8, h: 0.3, fontSize: 10, bold: true, color: T, charSpacing: 3 });
  if (deck.s3_duration) s.addText(deck.s3_duration, { x: 0.6, y: 1.0, w: 8.8, h: 0.4, fontSize: 16, color: Z4 });
  const stats3 = [
    { val: deck.s3_leads_cold, label: "leads going cold every month" },
    { val: deck.s3_close_rate, label: "close rate" },
    { val: deck.s3_revenue_left, label: "in revenue not being collected" },
  ];
  stats3.forEach((st, i) => {
    const x = 0.6 + i * 3.1;
    s.addShape(prs.ShapeType.roundRect, { x, y: 1.8, w: 2.9, h: 2.8, fill: { color: T + "18" }, line: { color: T + "55" }, rectRadius: 0.15 });
    s.addText(empty(st.val), { x, y: 2.3, w: 2.9, h: 1, fontSize: 44, bold: true, color: T, align: "center" });
    s.addText(st.label, { x, y: 3.4, w: 2.9, h: 1, fontSize: 13, color: Z4, align: "center", wrap: true, inset: 0.2 });
  });

  // 4 — How it works
  s = prs.addSlide();
  s.background = { color: LIGHT };
  s.addText("HOW THIS WORKS", { x: 0.6, y: 0.5, w: 8.8, h: 0.3, fontSize: 10, bold: true, color: T, charSpacing: 3 });
  [
    { n: "01", name: "Audit", timing: "Month 1", desc: "We go through your entire process and work out exactly where you're losing people." },
    { n: "02", name: "Install", timing: "Month 1–2", desc: "We build out the system — outreach templates, call framework, follow-up sequences." },
    { n: "03", name: "Manage", timing: "Month 2–3", desc: "We stay in it with you — reviewing calls, watching the numbers — until it runs properly." },
  ].forEach((p, i) => {
    const x = 0.6 + i * 3.1;
    s.addShape(prs.ShapeType.roundRect, { x, y: 1.3, w: 2.9, h: 3.2, fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.12 });
    s.addText(p.n, { x, y: 1.45, w: 2.9, h: 0.5, fontSize: 22, bold: true, color: T, inset: 0.2 });
    s.addText(p.name, { x, y: 1.95, w: 2.9, h: 0.4, fontSize: 18, bold: true, color: WHITE, inset: 0.2 });
    s.addText(p.timing, { x, y: 2.38, w: 2.9, h: 0.3, fontSize: 11, color: Z4, inset: 0.2 });
    s.addText(p.desc, { x, y: 2.75, w: 2.9, h: 1.5, fontSize: 12, color: Z4, inset: 0.2, wrap: true });
  });

  // 5 — What you're getting
  s = prs.addSlide();
  s.background = { color: LIGHT };
  s.addText("WHAT YOU'RE GETTING", { x: 0.6, y: 0.5, w: 8.8, h: 0.3, fontSize: 10, bold: true, color: T, charSpacing: 3 });
  ["Weekly 1:1 strategy calls", "Outreach system — templates, targeting, tracking", "Call 1 and Call 2 frameworks", "CRM and pipeline setup", "Automated follow-up sequences", "Call recording review and written feedback", "Monthly numbers review", "Direct access to the Ascendry team", "60-day check-in with a clear next step"].forEach((item, i) => {
    const col = i < 5 ? 0 : 1;
    const row = i < 5 ? i : i - 5;
    const x = 0.6 + col * 4.8;
    const y = 1.4 + row * 0.55;
    s.addShape(prs.ShapeType.ellipse, { x, y: y + 0.04, w: 0.3, h: 0.3, fill: { color: T }, line: { color: T } });
    s.addText("✓", { x, y: y + 0.03, w: 0.3, h: 0.3, fontSize: 10, bold: true, color: WHITE, align: "center" });
    s.addText(item, { x: x + 0.42, y, w: 4.1, h: 0.4, fontSize: 14, color: Z6 });
  });

  // 6 — 60-day plan
  s = prs.addSlide();
  s.background = { color: NAVY };
  s.addText("YOUR FIRST 60 DAYS", { x: 0.6, y: 0.5, w: 8.8, h: 0.3, fontSize: 10, bold: true, color: T, charSpacing: 3 });
  [
    { day: "Day 0", title: "You're in", desc: "Agreement signed, kick-off call booked, access set up." },
    { day: "Day 10", title: "System built", desc: "Outreach live, call process documented, CRM ready." },
    { day: "Day 30", title: "Check-in", desc: "Go through the numbers — what's working, what we're adjusting." },
    { day: "Day 60", title: "Review", desc: "Full picture of where you've landed, and what comes next." },
  ].forEach((t, i) => {
    const x = 0.6 + i * 2.3;
    s.addText(t.day, { x, y: 1.5, w: 2.1, h: 0.35, fontSize: 13, bold: true, color: T });
    s.addText(t.title, { x, y: 1.9, w: 2.1, h: 0.45, fontSize: 20, bold: true, color: WHITE });
    s.addText(t.desc, { x, y: 2.4, w: 2.1, h: 1.2, fontSize: 13, color: Z4, wrap: true });
  });

  // 7 — Investment
  s = prs.addSlide();
  s.background = { color: LIGHT };
  s.addText("THE INVESTMENT", { x: 0.6, y: 0.5, w: 8.8, h: 0.3, fontSize: 10, bold: true, color: T, charSpacing: 3 });
  s.addShape(prs.ShapeType.roundRect, { x: 0.6, y: 1.3, w: 3.5, h: 3.4, fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.15 });
  s.addText("Total", { x: 0.6, y: 1.6, w: 3.5, h: 0.4, fontSize: 14, color: Z4, inset: 0.3 });
  s.addText(empty(deck.s7_price), { x: 0.6, y: 2.1, w: 3.5, h: 1.5, fontSize: 60, bold: true, color: WHITE, inset: 0.3 });
  s.addShape(prs.ShapeType.roundRect, { x: 4.4, y: 1.3, w: 2.1, h: 1.5, fill: { color: WHITE }, line: { color: "e2e8f0" }, rectRadius: 0.1 });
  s.addText("Average client value", { x: 4.4, y: 1.4, w: 2.1, h: 0.4, fontSize: 11, color: Z6, inset: 0.15 });
  s.addText(empty(deck.s7_avg_value), { x: 4.4, y: 1.85, w: 2.1, h: 0.7, fontSize: 28, bold: true, color: Z9, inset: 0.15 });
  s.addShape(prs.ShapeType.roundRect, { x: 6.8, y: 1.3, w: 2.1, h: 1.5, fill: { color: WHITE }, line: { color: "e2e8f0" }, rectRadius: 0.1 });
  s.addText("Clients to break even", { x: 6.8, y: 1.4, w: 2.1, h: 0.4, fontSize: 11, color: Z6, inset: 0.15 });
  s.addText(empty(deck.s7_breakeven), { x: 6.8, y: 1.85, w: 2.1, h: 0.7, fontSize: 28, bold: true, color: Z9, inset: 0.15 });
  if (deck.s7_why_pays) s.addText(deck.s7_why_pays, { x: 4.4, y: 3.1, w: 4.7, h: 1.2, fontSize: 15, color: Z6, wrap: true });

  // 8 — Next steps
  s = prs.addSlide();
  s.background = { color: NAVY };
  s.addText("IF YOU'RE IN", { x: 0.6, y: 0.5, w: 8.8, h: 0.3, fontSize: 10, bold: true, color: T, charSpacing: 3 });
  [
    { n: "01", title: "Agreement signed", desc: "We send it over today. Takes 5 minutes." },
    { n: "02", title: "Kick-off call booked", desc: "Usually within 48 hours of signing." },
    { n: "03", title: "Audit delivered", desc: "We go through your full process together." },
    { n: "04", title: "Work starts", desc: "Outreach live, CRM set up, calls tracked." },
  ].forEach((st, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 4.7;
    const y = 1.3 + row * 2.2;
    s.addShape(prs.ShapeType.roundRect, { x, y, w: 4.4, h: 2, fill: { color: T + "18" }, line: { color: T + "55" }, rectRadius: 0.15 });
    s.addText(st.n, { x, y: y + 0.15, w: 4.4, h: 0.6, fontSize: 30, bold: true, color: T, inset: 0.25 });
    s.addText(st.title, { x, y: y + 0.75, w: 4.4, h: 0.45, fontSize: 18, bold: true, color: WHITE, inset: 0.25 });
    s.addText(st.desc, { x, y: y + 1.22, w: 4.4, h: 0.6, fontSize: 13, color: Z4, inset: 0.25 });
  });

  await prs.writeFile({ fileName: `${empty(deck.s1_name, "Ascendry Pitch Deck")} — Deck.pptx` });
}

// ─── Main component ───────────────────────────────────────────────────────────

interface DeckPageProps {
  clients: AscendryClient[];
  sessions: CallSession[];
  decks: PitchDeck[];
}

export default function DeckPage({ clients, sessions, decks }: DeckPageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deck, setDeck] = useState<DeckState>(EMPTY_DECK);
  const [presenting, setPresenting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [exporting, setExporting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedClient = clients.find(c => c.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) return;
    const client = clients.find(c => c.id === selectedId);
    if (!client) return;
    const clientSessions = sessions.filter(s => s.client_id === selectedId);
    const saved = decks.find(d => d.client_id === selectedId) ?? null;
    setDeck(initDeck(client, clientSessions, saved));
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleSave = useCallback((data: DeckState) => {
    if (!selectedId) return;
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(async () => {
        await upsertPitchDeck({
          id: data.id,
          client_id: selectedId,
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
    }, 1400);
  }, [selectedId]);

  function update(patch: Partial<DeckState>) {
    if (!selectedId) return;
    const updated = { ...deck, ...patch };
    setDeck(updated);
    scheduleSave(updated);
  }

  async function handleExport() {
    setExporting(true);
    try { await exportToPptx(deck); } finally { setExporting(false); }
  }

  return (
    <>
      {presenting && <PresentMode deck={deck} onClose={() => setPresenting(false)} />}

      <div className="min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="sticky top-14 lg:top-0 z-20 flex items-center gap-4 px-4 lg:px-8 py-3 bg-[#0a0b0f] border-b border-[#1e2130]">
          {/* Client selector */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs text-zinc-500 shrink-0">Deck for</span>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e2130] hover:border-zinc-600 bg-[#111318] text-sm font-medium text-white transition-colors min-w-40"
              >
                <span className="truncate max-w-48">
                  {selectedClient?.name ?? "Select a client"}
                </span>
                <ChevronDown size={14} className="text-zinc-500 shrink-0 ml-auto" />
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-20 min-w-56 bg-[#111318] border border-[#1e2130] rounded-xl shadow-2xl py-1.5 overflow-hidden">
                    {clients.length === 0 && (
                      <p className="px-4 py-2 text-xs text-zinc-500">No clients in pipeline</p>
                    )}
                    {clients.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedId(c.id); setDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          c.id === selectedId
                            ? "text-violet-300 bg-violet-600/10"
                            : "text-zinc-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="ml-2 text-xs text-zinc-600">{c.stage}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {saveStatus === "saving" && (
              <span className="text-xs text-zinc-600">Saving…</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check size={10} />Saved
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExport}
              disabled={!selectedClient || exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-[#1e2130] hover:border-zinc-600 transition-colors disabled:opacity-30"
            >
              <Download size={12} />
              {exporting ? "Exporting…" : "Export .pptx"}
            </button>
            <button
              onClick={() => setPresenting(true)}
              disabled={!selectedClient}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-30"
              style={{ background: TEAL }}
            >
              <Maximize2 size={12} />
              Present
            </button>
          </div>
        </div>

        {/* Content */}
        {!selectedClient ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-32 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#1e2130]" style={{ background: DARK }}>
              <span className="text-xl font-bold" style={{ color: TEAL }}>↑</span>
            </div>
            <div>
              <p className="text-base font-semibold text-white mb-1">Select a client to start</p>
              <p className="text-sm text-zinc-500">Pick someone from the dropdown above and the deck will auto-populate from their prep notes.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 lg:px-8 py-8 space-y-5">
            <DocSlide1 d={deck} u={update} />
            <DocSlide2 d={deck} u={update} />
            <DocSlide3 d={deck} u={update} />
            <DocSlide4 />
            <DocSlide5 />
            <DocSlide6 />
            <DocSlide7 d={deck} u={update} />
            <DocSlide8 />
          </div>
        )}
      </div>
    </>
  );
}
