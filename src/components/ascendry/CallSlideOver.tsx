"use client";

import { useState, useTransition, Fragment } from "react";
import {
  X, ChevronDown, ChevronRight, Phone, AlertTriangle,
  CheckSquare, Square, Plus, MessageSquare, Clock, Check,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { upsertCallSession } from "@/app/ascendry/actions";
import type { AscendryClient, CallSession } from "@/lib/ascendry-queries";

// ─── Script content ──────────────────────────────────────────────────────────

interface ScriptItem {
  type: "checklist" | "script" | "question" | "note";
  label?: string;
  text?: string;
  items?: string[];
}
interface ScriptPhase {
  title: string;
  timing?: string;
  items: ScriptItem[];
}

const CALL1_PHASES: ScriptPhase[] = [
  {
    title: "Before the Call",
    items: [
      { type: "checklist", items: [
        "Review their Instagram / offer / any context from outreach",
        "Check outreach notes — what did they respond to?",
        "Set a quiet, focused environment — phone on silent",
        "Open this prep form and fill in what you know",
        "Get into a curious, neutral state — diagnose, don't pitch",
      ]},
    ],
  },
  {
    title: "Frame Setting",
    timing: "0–5 mins",
    items: [
      { type: "script", text: "Hey [name], great to finally connect. So the point of this call is pretty simple — I want to understand your situation clearly before we talk about anything else. No pitch, no selling, just getting clear on where you're at. Sound good?" },
      { type: "note", text: "Wait for their response, then continue:" },
      { type: "script", text: "Perfect. So first things first — how's business going right now?" },
      { type: "script", text: "And specifically — what are you working on at the moment? What's the main thing you're trying to grow?" },
    ],
  },
  {
    title: "Diagnosis — 7 Questions",
    timing: "5–35 mins",
    items: [
      { type: "question", label: "Q1 — The Business", text: "Tell me about your offer — who do you help, what do you do for them, and what are you charging?" },
      { type: "question", label: "Q2 — Lead Flow", text: "How are you getting leads right now? And roughly, how many new conversations are you having each week?" },
      { type: "question", label: "Q3 — Sales Process", text: "Walk me through what happens when someone shows interest. From the first message to them paying — what does that journey look like?" },
      { type: "question", label: "Q4 — Close Rate", text: "Out of every 10 calls you get on, how many close? And is that a number you're happy with, or is it frustrating you?" },
      { type: "question", label: "Q5 — Follow-Up", text: "What happens when someone doesn't close on the call? Do you follow up — and if so, what does that look like?" },
      { type: "question", label: "Q6 — 90-Day Goal", text: "Here's an important one — in a perfect world, what would the next 90 days look like for you? Not what you think is realistic — what would you actually want?" },
      { type: "question", label: "Q7 — The Real Obstacle", text: "So given everything you've told me — what's the one thing standing between where you are now and [their goal]? What's actually in the way?" },
    ],
  },
  {
    title: "Close Call 1",
    timing: "35–45 mins",
    items: [
      { type: "note", text: "Summarise what you've heard back to them:" },
      { type: "script", text: "So let me just play back what I've heard. You're doing [their offer], getting about [leads per week] conversations a week, closing at roughly [close rate], and the biggest thing in the way right now is '[their exact words]'. Does that feel accurate?" },
      { type: "note", text: "Tease the solution:" },
      { type: "script", text: "What we do is build systems that fix exactly that. We've worked with people in almost identical situations — inconsistent leads, low close rate, no real pipeline — and got them generating 3–5x more revenue within 90 days. I'd like to show you specifically how that would work for you." },
      { type: "note", text: "Book the next call:" },
      { type: "script", text: "What I'd suggest is this — let me put together a specific plan based on everything you've shared today. Can we find 45 minutes in the next 48 hours? I'll come back with numbers and a specific roadmap for your situation." },
    ],
  },
  {
    title: "After the Call",
    items: [
      { type: "checklist", items: [
        "Log the outcome in the platform now while it's fresh",
        "Fill in ALL prep fields — their exact words especially",
        "Send a follow-up message within 1 hour",
        "Book the Call 2 date in the platform",
        "Note any disqualification flags you picked up",
      ]},
    ],
  },
];

const CALL2_PHASES: ScriptPhase[] = [
  {
    title: "Before the Call",
    items: [
      { type: "checklist", items: [
        "Review their goal: [their goal]",
        "Review key phrases — their exact words: [key phrases]",
        "Have your price and programme breakdown ready",
        "Set a quiet, focused environment — this is a decision call",
        "Commit to the close — silence after the price is your friend",
      ]},
    ],
  },
  {
    title: "Opening — Recap",
    timing: "0–5 mins",
    items: [
      { type: "script", text: "Hey [name], good to be back. So last time we covered a lot — you told me about [their offer], the main challenge was [their exact words], and when I asked what the perfect 90 days looked like, you said [their goal]. Does that still feel right, or has anything shifted since we last spoke?" },
      { type: "note", text: "Wait for their response, then:" },
      { type: "script", text: "Great. So I've been thinking about your situation specifically, and I want to walk you through exactly what I'd do if I were in your position." },
    ],
  },
  {
    title: "Present the Solution",
    timing: "5–25 mins",
    items: [
      { type: "note", text: "Phase 1 — Name the Problem:" },
      { type: "script", text: "Here's what I see with most people at your stage. You've got an offer that works, you're doing the work — but there's no reliable system bringing in consistent conversations. So revenue is unpredictable. Some months are great, others you're wondering where the next client's coming from. That sound familiar?" },
      { type: "note", text: "Phase 2 — The Framework:" },
      { type: "script", text: "What we build is a 3-part system. First, a consistent outreach engine — so you're generating qualified conversations every week, not waiting for referrals. Second, a diagnostic call process — so the calls you do have, you're converting a much higher percentage of them. Third, a follow-up sequence — because most people who don't close on the day will close within 30 days if you handle it right." },
      { type: "note", text: "Phase 3 — Proof and Tailoring:" },
      { type: "script", text: "We've had clients come in at exactly where you are — [close rate] close rate, inconsistent leads — and within 90 days they're booking 10–15 calls a week and closing 3–4 consistently. For you specifically, based on what you told me, the first thing I'd fix is the front end. That alone would probably double your close rate within 60 days." },
    ],
  },
  {
    title: "Price Presentation",
    timing: "25–30 mins",
    items: [
      { type: "script", text: "So in terms of what it looks like to work together — the investment is [price]. That gets you 90 days of 1:1 coaching, weekly strategy calls, full access to the Ascendry platform and CRM, and me personally reviewing your calls and outreach. Most clients recoup that investment within the first month." },
      { type: "note", text: "Pause. Let the number land. Don't fill the silence." },
      { type: "script", text: "Does the investment work for you?" },
    ],
  },
  {
    title: "Close & Silence",
    timing: "30–35 mins",
    items: [
      { type: "script", text: "So [name] — based on everything we've talked about, do you want to build this system?" },
      { type: "note", text: "STOP. SAY NOTHING. WAIT. Whoever speaks first loses. If they hesitate or go quiet, let the silence sit. Do not fill it. If they have a question or objection, use the Objections panel." },
    ],
  },
  {
    title: "Confirm Next Steps",
    timing: "35–45 mins",
    items: [
      { type: "script", text: "Brilliant. Here's exactly what happens now — I'll send over the agreement in the next hour, you'll have access to the platform within 24 hours, and we'll book our first proper onboarding call this week. I'll walk you through the full system and we'll map out your first 30 days together. Does that all make sense? Any questions before I send that over?" },
    ],
  },
];

// ─── Objections ───────────────────────────────────────────────────────────────

interface Objection {
  trigger: string;
  acknowledge: string;
  isolate: string;
  reframe: string;
  close: string;
}

const OBJECTIONS: Objection[] = [
  {
    trigger: "I need to think about it",
    acknowledge: "Totally makes sense — this is a big decision.",
    isolate: "Is it the thinking you need to do, or is there something specific you're unsure about?",
    reframe: "Most people who say that are either unsure about the investment, unsure it'll work, or there's a conversation they need to have. Which of those is closest for you?",
    close: "If we can resolve that right now, would you be ready to move forward today?",
  },
  {
    trigger: "It's too expensive",
    acknowledge: "I hear you, and I respect the honesty.",
    isolate: "Is it that the budget genuinely isn't there, or is it that you're not sure the return justifies the investment?",
    reframe: "If I could show you how clients in your position typically make [price] back within 60 days, would the investment make sense?",
    close: "What outcome would you need to see in the first 90 days for this to be a clear yes for you?",
  },
  {
    trigger: "I don't have the budget",
    acknowledge: "I appreciate you being straight with me.",
    isolate: "When you say budget — is it genuinely not available right now, or is it about finding the right time?",
    reframe: "The clients who get the best results are always the ones who invest when they're still building, not after. The system pays for itself — but it needs to be built first.",
    close: "What if we structured it in a way that worked for your situation right now — would that change things?",
  },
  {
    trigger: "How do I know it'll work?",
    acknowledge: "That's a completely fair question and I'd be asking the same thing.",
    isolate: "What specifically would you need to see to feel confident it would work for you?",
    reframe: "The honest answer is I can't guarantee results — no one can. What I can guarantee is the process, the support, and that we stay with you until the system is working.",
    close: "If you spoke to someone in a similar position who went through this and came out the other side — would that help? I can connect you.",
  },
  {
    trigger: "I already have someone helping me",
    acknowledge: "Great — sounds like you're already investing in your growth.",
    isolate: "Are you happy with the results you're getting with them right now, or is there a gap somewhere?",
    reframe: "A lot of the people I work with had someone before they came to us. What matters is whether what you're doing now is getting you to [their goal].",
    close: "What would need to be different about your situation for you to consider making a change?",
  },
  {
    trigger: "I need to speak to my partner",
    acknowledge: "Of course — big decisions are better made together.",
    isolate: "Is your partner involved in the business day-to-day, or is this more about a financial conversation with them?",
    reframe: "Let me give you everything you need to have that conversation confidently. The last thing I want is for you to go back with half the picture.",
    close: "Can you get them on a call this week? I'm happy to jump on with you both so they can ask any questions directly.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface PrepTokens {
  name: string;
  their_offer?: string | null;
  their_90_day_goal?: string | null;
  leads_per_week?: string | null;
  current_close_rate?: string | null;
  their_price_point?: string | null;
  key_phrases?: string[];
}

function resolveToken(token: string, t: PrepTokens): string | null {
  const tk = token.toLowerCase();
  if (tk === "name") return t.name || null;
  if (tk === "their offer") return t.their_offer || null;
  if (tk === "their goal" || tk === "their exact words") return t.their_90_day_goal || null;
  if (tk === "leads per week") return t.leads_per_week || null;
  if (tk === "close rate") return t.current_close_rate || null;
  if (tk === "price") return t.their_price_point || null;
  if (tk === "key phrases") return t.key_phrases?.filter(Boolean).join(", ") || null;
  return null;
}

function TokenText({ text, tokens }: { text: string; tokens: PrepTokens }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]$/);
        if (!m) return <Fragment key={i}>{part}</Fragment>;
        const val = resolveToken(m[1], tokens);
        if (val) return <span key={i} className="text-violet-300 font-medium">{val}</span>;
        return <span key={i} className="text-amber-400 italic border-b border-dashed border-amber-400/40">{part}</span>;
      })}
    </>
  );
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChecklistItem({ text, tokens }: { text: string; tokens: PrepTokens }) {
  const [checked, setChecked] = useState(false);
  return (
    <button
      onClick={() => setChecked(v => !v)}
      className="flex items-start gap-2 text-left w-full group"
    >
      {checked
        ? <CheckSquare size={14} className="text-emerald-400 mt-0.5 shrink-0" />
        : <Square size={14} className="text-zinc-600 mt-0.5 shrink-0 group-hover:text-zinc-400" />}
      <span className={`text-xs leading-snug ${checked ? "line-through text-zinc-600" : "text-zinc-300"}`}>
        <TokenText text={text} tokens={tokens} />
      </span>
    </button>
  );
}

function PhaseCard({
  phase, defaultOpen, tokens,
}: { phase: ScriptPhase; defaultOpen: boolean; tokens: PrepTokens }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#1e2130] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#111318] hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {open ? <ChevronDown size={13} className="text-zinc-500" /> : <ChevronRight size={13} className="text-zinc-500" />}
          <span className="text-sm font-semibold text-zinc-200">{phase.title}</span>
          {phase.timing && (
            <span className="text-xs text-zinc-500 font-normal">· {phase.timing}</span>
          )}
        </div>
      </button>
      {open && (
        <div className="px-4 py-3 bg-[#0d0e14] space-y-3">
          {phase.items.map((item, i) => {
            if (item.type === "checklist") return (
              <div key={i} className="space-y-2">
                {item.items!.map((txt, j) => (
                  <ChecklistItem key={j} text={txt} tokens={tokens} />
                ))}
              </div>
            );
            if (item.type === "script") return (
              <div key={i} className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg px-3 py-2.5">
                <p className="text-xs leading-relaxed text-zinc-200 italic">
                  <TokenText text={`"${item.text!}"`} tokens={tokens} />
                </p>
              </div>
            );
            if (item.type === "question") return (
              <div key={i} className="border-l-2 border-violet-600/40 pl-3 space-y-1">
                <p className="text-xs font-semibold text-violet-400">{item.label}</p>
                <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg px-3 py-2">
                  <p className="text-xs leading-relaxed text-zinc-200 italic">
                    <TokenText text={`"${item.text!}"`} tokens={tokens} />
                  </p>
                </div>
              </div>
            );
            if (item.type === "note") return (
              <p key={i} className="text-xs text-zinc-500 italic">
                <TokenText text={item.text!} tokens={tokens} />
              </p>
            );
            return null;
          })}
        </div>
      )}
    </div>
  );
}

// ─── Prep Tab ─────────────────────────────────────────────────────────────────

const DISQUAL_FLAGS = [
  "No consistent leads",
  "No real offer",
  "Not the decision maker",
  "No budget",
  "Wants guarantees",
  "Hostile/dismissive",
];

interface PrepState {
  call_type: "diagnostic" | "close";
  scheduled_at: string;
  status: "upcoming" | "in_progress" | "completed" | "no_show";
  their_offer: string;
  their_price_point: string;
  leads_per_week: string;
  current_close_rate: string;
  follow_up_process: string;
  their_90_day_goal: string;
  urgency_level: "low" | "medium" | "high";
  decision_maker: boolean;
  second_decision_maker: string;
  key_phrases: string[];
  emotional_signals: string;
  disqualification_flags: string[];
  prep_notes: string;
}

function sessionToPrep(s: CallSession): PrepState {
  return {
    call_type: s.call_type,
    scheduled_at: s.scheduled_at ? new Date(s.scheduled_at).toISOString().slice(0, 16) : "",
    status: s.status,
    their_offer: s.their_offer ?? "",
    their_price_point: s.their_price_point ?? "",
    leads_per_week: s.leads_per_week ?? "",
    current_close_rate: s.current_close_rate ?? "",
    follow_up_process: s.follow_up_process ?? "",
    their_90_day_goal: s.their_90_day_goal ?? "",
    urgency_level: s.urgency_level,
    decision_maker: s.decision_maker,
    second_decision_maker: s.second_decision_maker ?? "",
    key_phrases: s.key_phrases ?? [],
    emotional_signals: s.emotional_signals ?? "",
    disqualification_flags: s.disqualification_flags ?? [],
    prep_notes: s.prep_notes ?? "",
  };
}

const EMPTY_PREP: PrepState = {
  call_type: "diagnostic",
  scheduled_at: "",
  status: "upcoming",
  their_offer: "",
  their_price_point: "",
  leads_per_week: "",
  current_close_rate: "",
  follow_up_process: "",
  their_90_day_goal: "",
  urgency_level: "medium",
  decision_maker: true,
  second_decision_maker: "",
  key_phrases: [],
  emotional_signals: "",
  disqualification_flags: [],
  prep_notes: "",
};

interface PrepTabProps {
  prep: PrepState;
  setPrep: (p: PrepState) => void;
  onSave: () => void;
  isSaving: boolean;
}

function PrepTab({ prep, setPrep, onSave, isSaving }: PrepTabProps) {
  const [tagInput, setTagInput] = useState("");
  const up = (patch: Partial<PrepState>) => setPrep({ ...prep, ...patch });

  function addTag(val: string) {
    const trimmed = val.trim().replace(/,+$/, "");
    if (!trimmed || prep.key_phrases.includes(trimmed)) return;
    up({ key_phrases: [...prep.key_phrases, trimmed] });
    setTagInput("");
  }
  function removeTag(t: string) {
    up({ key_phrases: prep.key_phrases.filter(k => k !== t) });
  }
  function toggleFlag(flag: string) {
    const has = prep.disqualification_flags.includes(flag);
    up({ disqualification_flags: has
      ? prep.disqualification_flags.filter(f => f !== flag)
      : [...prep.disqualification_flags, flag],
    });
  }

  return (
    <div className="p-4 space-y-5 pb-24">
      {/* Call type + status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Call Type</label>
          <select
            className="input-base w-full text-sm"
            value={prep.call_type}
            onChange={e => up({ call_type: e.target.value as PrepState["call_type"] })}
          >
            <option value="diagnostic">Call 1 — Diagnostic</option>
            <option value="close">Call 2 — Close</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Status</label>
          <select
            className="input-base w-full text-sm"
            value={prep.status}
            onChange={e => up({ status: e.target.value as PrepState["status"] })}
          >
            <option value="upcoming">Upcoming</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      {/* Scheduled date/time */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Scheduled Date & Time</label>
        <input
          type="datetime-local"
          className="input-base w-full text-sm"
          value={prep.scheduled_at}
          onChange={e => up({ scheduled_at: e.target.value })}
        />
      </div>

      {/* Offer context */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Context</p>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Their Offer</label>
          <input
            className="input-base w-full text-sm"
            placeholder="What do they sell? Who to?"
            value={prep.their_offer}
            onChange={e => up({ their_offer: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Their Price Point</label>
          <input
            className="input-base w-full text-sm"
            placeholder="e.g. £2k/month"
            value={prep.their_price_point}
            onChange={e => up({ their_price_point: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Leads / Week</label>
            <input
              className="input-base w-full text-sm"
              placeholder="e.g. 5–10"
              value={prep.leads_per_week}
              onChange={e => up({ leads_per_week: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Current Close Rate</label>
            <input
              className="input-base w-full text-sm"
              placeholder="e.g. 20%"
              value={prep.current_close_rate}
              onChange={e => up({ current_close_rate: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Current Follow-Up Process</label>
          <textarea
            className="input-base w-full text-sm resize-none"
            rows={2}
            placeholder="What do they do after a call doesn't close?"
            value={prep.follow_up_process}
            onChange={e => up({ follow_up_process: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Their 90-Day Goal <span className="text-zinc-600 font-normal">— in their exact words</span></label>
          <textarea
            className="input-base w-full text-sm resize-none"
            rows={3}
            placeholder={`"I want to be consistently doing £X a month and not stressing about where the next client's coming from"`}
            value={prep.their_90_day_goal}
            onChange={e => up({ their_90_day_goal: e.target.value })}
          />
        </div>
      </div>

      {/* Qualifying */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Qualifying</p>
        <div>
          <label className="block text-xs text-zinc-400 mb-2">Urgency Level</label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map(u => (
              <button
                key={u}
                onClick={() => up({ urgency_level: u })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${
                  prep.urgency_level === u
                    ? u === "high" ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                      : u === "medium" ? "bg-violet-600/20 border-violet-600/40 text-violet-300"
                      : "bg-zinc-700/50 border-zinc-600 text-zinc-200"
                    : "bg-transparent border-[#1e2130] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-zinc-400">Decision Maker?</label>
            <button
              onClick={() => up({ decision_maker: !prep.decision_maker })}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                prep.decision_maker ? "bg-emerald-600" : "bg-zinc-700"
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                prep.decision_maker ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </button>
          </div>
          {!prep.decision_maker && (
            <input
              className="input-base w-full text-sm"
              placeholder="Who else is involved? (e.g. business partner)"
              value={prep.second_decision_maker}
              onChange={e => up({ second_decision_maker: e.target.value })}
            />
          )}
        </div>
      </div>

      {/* Intelligence */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Intelligence</p>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Key Phrases <span className="text-zinc-600 font-normal">— what they said that matters</span></label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {prep.key_phrases.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-600/15 border border-violet-600/30 text-xs text-violet-300"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-white">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <input
            className="input-base w-full text-sm"
            placeholder="Type a phrase and press Enter"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
            }}
            onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Emotional Signals</label>
          <textarea
            className="input-base w-full text-sm resize-none"
            rows={2}
            placeholder="Frustrated? Excited? Scared? What's underneath the words?"
            value={prep.emotional_signals}
            onChange={e => up({ emotional_signals: e.target.value })}
          />
        </div>
      </div>

      {/* Disqualification flags */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Disqualification Flags</p>
        {DISQUAL_FLAGS.map(flag => {
          const checked = prep.disqualification_flags.includes(flag);
          return (
            <button
              key={flag}
              onClick={() => toggleFlag(flag)}
              className="flex items-center gap-2.5 w-full text-left group"
            >
              {checked
                ? <CheckSquare size={14} className="text-red-400 shrink-0" />
                : <Square size={14} className="text-zinc-600 shrink-0 group-hover:text-zinc-400" />}
              <span className={`text-xs ${checked ? "text-red-300" : "text-zinc-400 group-hover:text-zinc-300"}`}>
                {flag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Prep notes */}
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Prep Notes</label>
        <textarea
          className="input-base w-full text-sm resize-none"
          rows={3}
          placeholder="Anything else relevant before the call..."
          value={prep.prep_notes}
          onChange={e => up({ prep_notes: e.target.value })}
        />
      </div>

      <Button onClick={onSave} loading={isSaving} className="w-full">
        <Check size={13} className="mr-1.5" />Save Prep
      </Button>
    </div>
  );
}

// ─── Objections Panel ─────────────────────────────────────────────────────────

function ObjectionsPanel({ onClose, tokens }: { onClose: () => void; tokens: PrepTokens }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="absolute inset-0 z-10 bg-[#0d0e14] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e2130]">
        <h3 className="text-sm font-semibold text-white">Objection Handler</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {OBJECTIONS.map((obj, i) => (
          <div key={i} className="border border-[#1e2130] rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#111318] hover:bg-zinc-800/40 transition-colors text-left"
            >
              <span className="text-sm font-medium text-zinc-200">"{obj.trigger}"</span>
              {expanded === i ? <ChevronDown size={13} className="text-zinc-500 shrink-0" /> : <ChevronRight size={13} className="text-zinc-500 shrink-0" />}
            </button>
            {expanded === i && (
              <div className="px-4 py-3 bg-[#0d0e14] space-y-3">
                {([
                  ["Acknowledge", obj.acknowledge],
                  ["Isolate", obj.isolate],
                  ["Reframe", obj.reframe],
                  ["Close", obj.close],
                ] as [string, string][]).map(([label, text]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-zinc-500 mb-1">{label}</p>
                    <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg px-3 py-2">
                      <p className="text-xs italic text-zinc-200 leading-relaxed">
                        <TokenText text={`"${text}"`} tokens={tokens} />
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Script Tab ───────────────────────────────────────────────────────────────

type Outcome = "progressed" | "closed" | "lost" | "follow_up" | "disqualified";

interface OutcomeState {
  outcome: Outcome | "";
  outcome_notes: string;
  next_step: string;
  next_call_scheduled_at: string;
}

const OUTCOME_LABELS: Record<Outcome, string> = {
  progressed:   "Progressed to Call 2",
  closed:       "Closed",
  lost:         "Lost",
  follow_up:    "Needs Follow Up",
  disqualified: "Disqualified",
};

const OUTCOME_COLORS: Record<Outcome, string> = {
  progressed:   "bg-violet-600/20 border-violet-600/40 text-violet-300",
  closed:       "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  lost:         "bg-zinc-700/40 border-zinc-600 text-zinc-400",
  follow_up:    "bg-amber-500/15 border-amber-500/40 text-amber-300",
  disqualified: "bg-red-600/15 border-red-600/40 text-red-300",
};

interface ScriptTabProps {
  prep: PrepState;
  clientName: string;
  sessions: CallSession[];
  sessionId?: string;
  onSaveOutcome: (o: OutcomeState) => void;
  isSaving: boolean;
}

function ScriptTab({ prep, clientName, sessions, sessionId, onSaveOutcome, isSaving }: ScriptTabProps) {
  const [showObjections, setShowObjections] = useState(false);
  const [outcome, setOutcome] = useState<OutcomeState>({
    outcome: "",
    outcome_notes: "",
    next_step: "",
    next_call_scheduled_at: "",
  });

  const tokens: PrepTokens = {
    name: clientName,
    their_offer: prep.their_offer,
    their_90_day_goal: prep.their_90_day_goal,
    leads_per_week: prep.leads_per_week,
    current_close_rate: prep.current_close_rate,
    their_price_point: prep.their_price_point,
    key_phrases: prep.key_phrases,
  };

  const phases = prep.call_type === "diagnostic" ? CALL1_PHASES : CALL2_PHASES;
  const pastSessions = sessions.filter(s => s.id !== sessionId && s.outcome);

  return (
    <div className="relative flex flex-col h-full">
      {showObjections && (
        <ObjectionsPanel onClose={() => setShowObjections(false)} tokens={tokens} />
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-4">
        {/* Unfilled token warning */}
        {[prep.their_offer, prep.their_90_day_goal, prep.leads_per_week, prep.current_close_rate].some(v => !v) && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
            <AlertTriangle size={13} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300">Some prep fields are empty — amber placeholders will appear in the script. Fill them in the Prep tab first for the best experience.</p>
          </div>
        )}

        {/* Script phases */}
        {phases.map((phase, i) => (
          <PhaseCard key={i} phase={phase} defaultOpen={i === 0} tokens={tokens} />
        ))}

        {/* Objections button */}
        <button
          onClick={() => setShowObjections(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800/40 border border-zinc-700/40 hover:bg-zinc-800 hover:border-zinc-600 transition-colors text-sm font-medium text-zinc-300"
        >
          <MessageSquare size={14} />
          Objection Handler
        </button>

        {/* Outcome section */}
        <div className="border border-[#1e2130] rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#111318] border-b border-[#1e2130]">
            <h4 className="text-sm font-semibold text-zinc-200">Call Outcome</h4>
          </div>
          <div className="p-4 space-y-4">
            {/* Outcome selector */}
            <div>
              <label className="block text-xs text-zinc-400 mb-2">Outcome</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(OUTCOME_LABELS) as [Outcome, string][]).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setOutcome(o => ({ ...o, outcome: o.outcome === k ? "" : k }))}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-left transition-colors ${
                      outcome.outcome === k
                        ? OUTCOME_COLORS[k]
                        : "bg-transparent border-[#1e2130] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Outcome Notes</label>
              <textarea
                className="input-base w-full text-sm resize-none"
                rows={2}
                placeholder="What happened on the call?"
                value={outcome.outcome_notes}
                onChange={e => setOutcome(o => ({ ...o, outcome_notes: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Next Step</label>
              <input
                className="input-base w-full text-sm"
                placeholder="e.g. Send agreement, book onboarding"
                value={outcome.next_step}
                onChange={e => setOutcome(o => ({ ...o, next_step: e.target.value }))}
              />
            </div>
            {(outcome.outcome === "follow_up" || outcome.outcome === "progressed") && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Next Call Date & Time</label>
                <input
                  type="datetime-local"
                  className="input-base w-full text-sm"
                  value={outcome.next_call_scheduled_at}
                  onChange={e => setOutcome(o => ({ ...o, next_call_scheduled_at: e.target.value }))}
                />
              </div>
            )}
            <Button
              onClick={() => onSaveOutcome(outcome)}
              loading={isSaving}
              disabled={!outcome.outcome}
              className="w-full"
            >
              <Check size={13} className="mr-1.5" />Save Outcome
            </Button>
          </div>
        </div>

        {/* Call history timeline */}
        {pastSessions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Call History</p>
            <div className="space-y-2">
              {pastSessions.map(s => (
                <div key={s.id} className="flex items-start gap-3 border border-[#1e2130] rounded-lg px-3 py-2.5 bg-[#111318]">
                  <div className="shrink-0 mt-0.5">
                    <Phone size={12} className="text-zinc-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-zinc-300">
                        {s.call_type === "diagnostic" ? "Call 1 — Diagnostic" : "Call 2 — Close"}
                      </span>
                      {s.outcome && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${OUTCOME_COLORS[s.outcome]}`}>
                          {OUTCOME_LABELS[s.outcome]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5">{fmtDateTime(s.created_at)}</p>
                    {s.outcome_notes && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{s.outcome_notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CallSlideOverProps {
  client: AscendryClient;
  sessions: CallSession[];
  onClose: () => void;
  onSessionsChanged: (sessions: CallSession[], movedToStage?: string) => void;
}

export default function CallSlideOver({ client, sessions, onClose, onSessionsChanged }: CallSlideOverProps) {
  const [activeTab, setActiveTab] = useState<"prep" | "script">("prep");
  const [isPending, startTransition] = useTransition();

  // Find active session (most recent without outcome, or create new)
  const activeSession = sessions.find(s => !s.outcome) ?? null;
  const [sessionId, setSessionId] = useState<string | undefined>(activeSession?.id);
  const [prep, setPrep] = useState<PrepState>(
    activeSession ? sessionToPrep(activeSession) : EMPTY_PREP
  );

  function handleSavePrep() {
    startTransition(async () => {
      const result = await upsertCallSession({
        id: sessionId,
        client_id: client.id,
        call_type: prep.call_type,
        scheduled_at: prep.scheduled_at ? new Date(prep.scheduled_at).toISOString() : null,
        status: prep.status,
        their_offer: prep.their_offer || null,
        their_price_point: prep.their_price_point || null,
        leads_per_week: prep.leads_per_week || null,
        current_close_rate: prep.current_close_rate || null,
        follow_up_process: prep.follow_up_process || null,
        their_90_day_goal: prep.their_90_day_goal || null,
        urgency_level: prep.urgency_level,
        decision_maker: prep.decision_maker,
        second_decision_maker: prep.second_decision_maker || null,
        key_phrases: prep.key_phrases,
        emotional_signals: prep.emotional_signals || null,
        disqualification_flags: prep.disqualification_flags,
        prep_notes: prep.prep_notes || null,
      });
      setSessionId(result.id);
      const updated = sessions.filter(s => s.id !== result.id).concat(result);
      onSessionsChanged(updated.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    });
  }

  function handleSaveOutcome(o: OutcomeState) {
    if (!o.outcome) return;
    startTransition(async () => {
      const STAGE_MAP: Record<string, string | undefined> = {
        progressed:   "Call Booked",
        closed:       "Closed",
        lost:         "Exited",
        disqualified: "Exited",
      };
      const result = await upsertCallSession({
        id: sessionId,
        client_id: client.id,
        call_type: prep.call_type,
        scheduled_at: prep.scheduled_at ? new Date(prep.scheduled_at).toISOString() : null,
        status: "completed",
        their_offer: prep.their_offer || null,
        their_price_point: prep.their_price_point || null,
        leads_per_week: prep.leads_per_week || null,
        current_close_rate: prep.current_close_rate || null,
        follow_up_process: prep.follow_up_process || null,
        their_90_day_goal: prep.their_90_day_goal || null,
        urgency_level: prep.urgency_level,
        decision_maker: prep.decision_maker,
        second_decision_maker: prep.second_decision_maker || null,
        key_phrases: prep.key_phrases,
        emotional_signals: prep.emotional_signals || null,
        disqualification_flags: prep.disqualification_flags,
        prep_notes: prep.prep_notes || null,
        outcome: o.outcome,
        outcome_notes: o.outcome_notes || null,
        next_step: o.next_step || null,
        next_call_scheduled_at: o.next_call_scheduled_at
          ? new Date(o.next_call_scheduled_at).toISOString()
          : null,
      });
      setSessionId(undefined);
      setPrep(EMPTY_PREP);
      const updated = sessions.filter(s => s.id !== result.id).concat(result);
      onSessionsChanged(
        updated.sort((a, b) => b.created_at.localeCompare(a.created_at)),
        STAGE_MAP[o.outcome] ?? undefined,
      );
    });
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[480px] bg-[#0d0e14] border-l border-[#1e2130] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e2130] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-600/30 flex items-center justify-center shrink-0">
              <Phone size={13} className="text-violet-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{client.name}</h2>
              <p className="text-xs text-zinc-500">
                {prep.call_type === "diagnostic" ? "Call 1 — Diagnostic" : "Call 2 — Close"}
                {prep.scheduled_at && (
                  <> · <Clock size={9} className="inline mb-0.5" /> {fmtDateTime(prep.scheduled_at)}</>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1 shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e2130] shrink-0">
          {(["prep", "script"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-violet-300 border-b-2 border-violet-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab === "prep" ? "Prep" : "Script"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "prep" ? (
            <PrepTab prep={prep} setPrep={setPrep} onSave={handleSavePrep} isSaving={isPending} />
          ) : (
            <ScriptTab
              prep={prep}
              clientName={client.name}
              sessions={sessions}
              sessionId={sessionId}
              onSaveOutcome={handleSaveOutcome}
              isSaving={isPending}
            />
          )}
        </div>
      </div>
    </>
  );
}
