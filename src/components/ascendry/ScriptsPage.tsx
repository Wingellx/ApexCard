"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MessageSquare, X } from "lucide-react";

// ─── Script data ──────────────────────────────────────────────────────────────

interface ScriptItem {
  type: "script" | "question" | "note" | "checklist";
  label?: string;
  text?: string;
  items?: string[];
  coaching_label?: string;
  coaching?: string;
}

interface ScriptPhase {
  title: string;
  timing?: string;
  items: ScriptItem[];
}

const CALL1: ScriptPhase[] = [
  {
    title: "Before the Call",
    items: [
      {
        type: "checklist",
        items: [
          "Review their Instagram / offer / any context from outreach",
          "Check what they responded to in the DMs",
          "Quiet space, phone on silent",
          "Get into a curious, diagnostic mindset — you're not here to pitch",
        ],
      },
    ],
  },
  {
    title: "Frame Setting",
    timing: "0–5 mins",
    items: [
      {
        type: "script",
        text: "Hey, great to finally connect. So the point of this call is simple — I want to understand your situation clearly before we talk about anything else. No pitch, no selling, just getting clear on where you're at. Sound good?",
        coaching_label: "Why",
        coaching: "You're giving them permission to relax. Most prospects brace for a sales pitch — this frame disarms that. If they're still guarded after this, slow down and be more human before moving on.",
      },
      {
        type: "script",
        text: "Perfect. So first things first — how's business going right now?",
        coaching_label: "Listening for",
        coaching: "Their energy and honesty. Are they open or closed? Frustrated or comfortable? This gives you the emotional temperature before you start digging.",
      },
      {
        type: "script",
        text: "And specifically — what are you working on at the moment? What's the main thing you're trying to grow?",
        coaching_label: "Listening for",
        coaching: "What they say first is usually what's front of mind. It might not be the real problem, but it tells you where to start.",
      },
    ],
  },
  {
    title: "Diagnosis — 7 Questions",
    timing: "5–35 mins",
    items: [
      {
        type: "question",
        label: "Q1 — The Business",
        text: "Tell me about your offer — who do you help, what do you do for them, and what are you charging?",
        coaching_label: "Listening for",
        coaching: "Clarity and confidence. If they can't explain their offer in 3 sentences, that's often a root problem. Note what they're charging — it tells you whether budget will be a friction point later.",
      },
      {
        type: "question",
        label: "Q2 — Lead Flow",
        text: "How are you getting leads right now? And roughly, how many new conversations are you having each week?",
        coaching_label: "Listening for",
        coaching: "Whether the problem is lead volume or conversion. Low conversations = front-end problem. Plenty of conversations but low closes = sales process problem. These need completely different solutions — make sure you know which one you're dealing with.",
      },
      {
        type: "question",
        label: "Q3 — Sales Process",
        text: "Walk me through what happens when someone shows interest. From the first message to them paying — what does that journey look like?",
        coaching_label: "Listening for",
        coaching: "Structure (or lack of it). A chaotic process = inconsistent results. Also listen for where people drop off — that's the biggest lever. If they say \"I just hop on a call and talk to them\" with no framework, that's your opportunity.",
      },
      {
        type: "question",
        label: "Q4 — Close Rate",
        text: "Out of every 10 calls you get on, how many close? And is that a number you're happy with, or is it frustrating you?",
        coaching_label: "Listening for",
        coaching: "Raw honesty and emotional investment. The number matters, but their relationship with the number matters more. Frustration = motivation to change. Indifference = harder to move. Low close rate + high frustration is your strongest buying signal.",
      },
      {
        type: "question",
        label: "Q5 — Follow-Up",
        text: "What happens when someone doesn't close on the call? Do you follow up — and if so, what does that look like?",
        coaching_label: "Listening for",
        coaching: "Whether they're leaving money on the table. Most people have zero follow-up process, which means they're losing 60–80% of potential revenue. This is almost always a quick win you can name. If they say \"I send one message and leave it\" — that's the answer.",
      },
      {
        type: "question",
        label: "Q6 — 90-Day Goal",
        text: "Here's an important one — in a perfect world, what would the next 90 days look like for you? Not what you think is realistic — what would you actually want?",
        coaching_label: "Listening for",
        coaching: "Their exact words. Write them down verbatim — these become the language you use in Call 2. Also notice the size of their thinking: if they think small, there may be a belief problem. If they think big, they're motivated. People who can't answer this clearly usually don't have enough pain yet.",
      },
      {
        type: "question",
        label: "Q7 — The Real Obstacle",
        text: "So given everything you've told me — what's the one thing standing between where you are now and that goal? What's actually in the way?",
        coaching_label: "Listening for",
        coaching: "Self-awareness and ownership. The best prospects know exactly what's holding them back. If they blame external factors — the niche is saturated, the economy is bad, the algorithm changed — that's a coachability flag. If they take ownership (\"I don't have a consistent process\", \"I'm not confident on calls\"), they're ready to invest in change.",
      },
    ],
  },
  {
    title: "Close Call 1",
    timing: "35–45 mins",
    items: [
      {
        type: "note",
        text: "Summarise everything back before you say anything about what you do:",
      },
      {
        type: "script",
        text: "So let me just play back what I've heard. You're doing [their offer], getting about [X] conversations a week, closing at roughly [X]%, and the biggest thing in the way right now is [their exact words]. Does that feel accurate?",
        coaching_label: "Why",
        coaching: "You're doing two things: proving you listened, and anchoring them to their own problem. When they hear it back, it becomes more real. Wait for them to confirm before moving on — don't rush past this moment.",
      },
      {
        type: "note",
        text: "Once they confirm, tease the solution — don't pitch it:",
      },
      {
        type: "script",
        text: "What we do is build systems that fix exactly that. We've worked with people in almost identical situations — inconsistent leads, low close rate, no real pipeline — and got them generating 3–5x more revenue within 90 days. I'd like to show you specifically how that would work for you.",
        coaching_label: "Why",
        coaching: "You're positioning, not pitching. The goal here is curiosity, not a full explanation. Less is more. If they ask \"how does it work?\" — that's a great sign. Don't answer in detail: \"that's exactly what I want to walk you through on the next call.\"",
      },
      {
        type: "note",
        text: "Book the next call:",
      },
      {
        type: "script",
        text: "What I'd suggest is this — let me put together a specific plan based on everything you've shared today. Can we find 45 minutes in the next 48 hours? I'll come back with numbers and a specific roadmap for your situation.",
        coaching_label: "Why",
        coaching: "Framing it as a plan you're building for them personally raises the perceived value of Call 2. You're not booking another sales call — you're delivering something. Get a specific time before you hang up. \"I'll send you a link\" leads to ghosting.",
      },
    ],
  },
  {
    title: "After the Call",
    items: [
      {
        type: "checklist",
        items: [
          "Log the outcome in the pipeline immediately — while it's fresh",
          "Write down their exact words from Q6 and Q7 verbatim",
          "Send a follow-up message within 1 hour",
          "Book the Call 2 date in the platform",
          "Note any disqualification flags you picked up",
        ],
      },
    ],
  },
];

const CALL2: ScriptPhase[] = [
  {
    title: "Before the Call",
    items: [
      {
        type: "checklist",
        items: [
          "Re-read their exact words from the 90-day goal question",
          "Review any key phrases and emotional signals you noted",
          "Have your price ready — know the number before you dial",
          "Quiet space, phone on silent",
          "Commit to the close — silence after the price is your friend",
        ],
      },
    ],
  },
  {
    title: "Opening — Recap",
    timing: "0–5 mins",
    items: [
      {
        type: "script",
        text: "Hey, good to be back. So last time we covered a lot — you told me about your offer, the main challenge was [their exact words from Call 1], and when I asked what the perfect 90 days looked like, you said [their goal verbatim]. Does that still feel right, or has anything shifted since we last spoke?",
        coaching_label: "Listening for",
        coaching: "Whether they confirm or correct. Corrections are gold — they tell you what actually mattered to them. If they've gone quiet or cold since Call 1, slow down here and re-establish rapport before moving on. Don't rush into the presentation.",
      },
      {
        type: "script",
        text: "Great. So I've been thinking about your situation specifically, and I want to walk you through exactly what I'd do if I were in your position.",
        coaching_label: "Why",
        coaching: "\"I've been thinking about your situation\" signals genuine investment. It's personal. You're not running a template — you're presenting something tailored. This sets the tone for the whole presentation.",
      },
    ],
  },
  {
    title: "Present the Solution",
    timing: "5–25 mins",
    items: [
      {
        type: "note",
        text: "Phase 1 — Name the Problem first, before presenting anything:",
      },
      {
        type: "script",
        text: "Here's what I see with most people at your stage. You've got an offer that works, you're doing the work — but there's no reliable system bringing in consistent conversations. So revenue is unpredictable. Some months are great, others you're wondering where the next client's coming from. That sound familiar?",
        coaching_label: "Why",
        coaching: "You're mirroring their situation back at them. The goal is for them to feel deeply understood before you offer anything. Don't rush past this — if they say \"yes, exactly\" with energy, you're on. If they seem neutral, dig in: \"what does that feel like month to month?\"",
      },
      {
        type: "note",
        text: "Phase 2 — The Framework. Keep this high-level:",
      },
      {
        type: "script",
        text: "What we build is a 3-part system. First, a consistent outreach engine — so you're generating qualified conversations every week, not waiting for referrals. Second, a diagnostic call process — so the calls you have, you're converting a much higher percentage. Third, a follow-up sequence — because most people who don't close on the day will close within 30 days if you handle it right.",
        coaching_label: "Why",
        coaching: "Keep this high-level. Don't get into deliverables or mechanics yet — that's for after they say yes. You want them nodding, not interrogating. If they ask \"how exactly does the outreach work?\" say: \"I'll walk you through the whole system in detail once we get started — I want to give you the full picture first.\"",
      },
      {
        type: "note",
        text: "Phase 3 — Proof and Tailoring:",
      },
      {
        type: "script",
        text: "We've had clients come in at exactly where you are — low close rate, inconsistent leads — and within 90 days they're booking 10–15 calls a week and closing 3–4 consistently. For you specifically, based on what you told me, the first thing I'd fix is the front end. That alone would probably double your close rate within 60 days.",
        coaching_label: "Why",
        coaching: "Social proof reduces perceived risk. Tailoring it to their specific situation (their close rate, their leads) makes it feel personal, not a copy-paste pitch. Use their exact numbers back. \"You said you're closing at about 20% — we'd expect to get that to 40–50% within the first 8 weeks.\"",
      },
    ],
  },
  {
    title: "Price Presentation",
    timing: "25–30 mins",
    items: [
      {
        type: "script",
        text: "So in terms of what it looks like to work together — the investment is [price]. That gets you 90 days of 1:1 coaching, weekly strategy calls, full access to the Ascendry platform and CRM, and me personally reviewing your calls and outreach. Most clients recoup that investment within the first month.",
        coaching_label: "Why",
        coaching: "Present the price clearly and confidently. Don't soften it, apologise for it, or preface it with \"so it's not cheap but...\". Say the number, say what it includes, and stop talking. The next person to speak loses — if you fill the silence, you'll undermine yourself.",
      },
      {
        type: "note",
        text: "Pause. Let the number land. Say nothing.",
      },
      {
        type: "script",
        text: "Does the investment work for you?",
        coaching_label: "Listening for",
        coaching: "One short question, then absolute silence. If they ask \"what exactly do I get?\" — they're interested, not objecting. Walk them through the deliverables in detail. If they go quiet — let it sit. Five seconds of silence feels like an eternity but does more work than anything you could say.",
      },
    ],
  },
  {
    title: "Close & Silence",
    timing: "30–35 mins",
    items: [
      {
        type: "script",
        text: "So — based on everything we've talked about, do you want to build this system?",
        coaching_label: "Remember",
        coaching: "One direct question. Then stop. Do not add \"I mean, take your time\" or \"no pressure\" — that immediately softens the close and signals you're not confident. Whoever speaks first loses. If they hesitate or go quiet, let the silence sit for at least 5 full seconds before you say anything. If they have an objection, handle it — use the Objection Handler below.",
      },
    ],
  },
  {
    title: "Confirm Next Steps",
    timing: "35–45 mins",
    items: [
      {
        type: "script",
        text: "Brilliant. Here's exactly what happens now — I'll send over the agreement in the next hour, you'll have access to the platform within 24 hours, and we'll book our first proper onboarding call this week. I'll walk you through the full system and we'll map out your first 30 days together. Does that all make sense? Any questions before I send that over?",
        coaching_label: "Why",
        coaching: "Move fast once they say yes. Get to logistics immediately so the decision feels real and irreversible. Every second you wait is a chance for doubt to creep in. Book the onboarding call before you hang up — don't leave it as \"I'll send a link.\"",
      },
    ],
  },
];

// ─── Objections ───────────────────────────────────────────────────────────────

const OBJECTIONS = [
  {
    trigger: "I need to think about it",
    acknowledge: "Totally makes sense — this is a big decision.",
    isolate: "Is it the thinking you need to do, or is there something specific you're unsure about?",
    reframe: "Most people who say that are either unsure about the investment, unsure it'll work for them, or there's a conversation they need to have first. Which of those is closest for you?",
    close: "If we can resolve that right now, would you be ready to move forward today?",
  },
  {
    trigger: "It's too expensive",
    acknowledge: "I hear you, and I respect the honesty.",
    isolate: "Is it that the budget genuinely isn't there, or is it that you're not sure the return justifies the investment?",
    reframe: "If I could show you how clients in your position typically make this back within 60 days, would the investment make sense?",
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
    reframe: "I can't guarantee results — no one can. What I can guarantee is the process, the support, and that we stay with you until the system is working.",
    close: "If you spoke to someone in a similar position who went through this — would that help? I can connect you.",
  },
  {
    trigger: "I already have someone helping me",
    acknowledge: "Great — sounds like you're already investing in your growth.",
    isolate: "Are you happy with the results you're getting with them, or is there a gap somewhere?",
    reframe: "What matters is whether what you're doing now is actually getting you to where you said you want to be.",
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

// ─── Components ───────────────────────────────────────────────────────────────

function ChecklistSection({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setChecked(prev => {
    const n = new Set(prev);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });
  return (
    <ul className="space-y-2.5">
      {items.map((text, i) => (
        <li key={i}>
          <button
            onClick={() => toggle(i)}
            className="flex items-start gap-2.5 text-left w-full group"
          >
            <span className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              checked.has(i)
                ? "bg-emerald-600 border-emerald-600"
                : "border-zinc-600 group-hover:border-zinc-500"
            }`}>
              {checked.has(i) && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <span className={`text-sm leading-snug transition-colors ${
              checked.has(i) ? "line-through text-zinc-600" : "text-zinc-300"
            }`}>
              {text}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ScriptBlock({ item }: { item: ScriptItem }) {
  if (item.type === "checklist") {
    return <ChecklistSection items={item.items!} />;
  }

  if (item.type === "note") {
    return (
      <p className="text-sm text-zinc-500 italic">{item.text}</p>
    );
  }

  const isQuestion = item.type === "question";

  return (
    <div className={`rounded-xl overflow-hidden border ${
      isQuestion
        ? "border-violet-600/20"
        : "border-[#1e2130]"
    }`}>
      {isQuestion && item.label && (
        <div className="px-4 py-2 bg-violet-600/10 border-b border-violet-600/20">
          <span className="text-xs font-semibold text-violet-400">{item.label}</span>
        </div>
      )}
      <div className="px-4 py-3 bg-[#111318]">
        <p className="text-sm leading-relaxed text-zinc-100 italic">
          "{item.text}"
        </p>
      </div>
      {item.coaching && (
        <div className="px-4 py-2.5 bg-[#0d0e14] border-t border-[#1e2130]">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            {item.coaching_label ?? "Listening for"}
          </span>
          <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{item.coaching}</p>
        </div>
      )}
    </div>
  );
}

function PhaseCard({ phase, defaultOpen }: { phase: ScriptPhase; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#1e2130] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-[#111318] hover:bg-zinc-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          {open
            ? <ChevronDown size={14} className="text-zinc-500 shrink-0" />
            : <ChevronRight size={14} className="text-zinc-500 shrink-0" />}
          <span className="text-sm font-semibold text-zinc-100">{phase.title}</span>
          {phase.timing && (
            <span className="text-xs text-zinc-500">· {phase.timing}</span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          open
            ? "text-zinc-400 border-zinc-700 bg-zinc-800"
            : "text-zinc-600 border-zinc-800"
        }`}>
          {open ? "collapse" : "expand"}
        </span>
      </button>

      {open && (
        <div className="px-5 py-4 bg-[#0d0e14] space-y-4">
          {phase.items.map((item, i) => (
            <ScriptBlock key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ObjectionsPanel({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#0d0e14] border border-[#1e2130] rounded-t-2xl md:rounded-2xl w-full md:max-w-xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2130] shrink-0">
          <h3 className="text-base font-semibold text-white">Objection Handler</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 p-1">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {OBJECTIONS.map((obj, i) => (
            <div key={i} className="border border-[#1e2130] rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#111318] hover:bg-zinc-800/40 transition-colors text-left gap-3"
              >
                <span className="text-sm font-medium text-zinc-200">"{obj.trigger}"</span>
                {expanded === i
                  ? <ChevronDown size={13} className="text-zinc-500 shrink-0" />
                  : <ChevronRight size={13} className="text-zinc-500 shrink-0" />}
              </button>
              {expanded === i && (
                <div className="px-4 py-4 bg-[#0d0e14] space-y-4">
                  {([
                    ["Acknowledge", obj.acknowledge],
                    ["Isolate", obj.isolate],
                    ["Reframe", obj.reframe],
                    ["Close", obj.close],
                  ] as [string, string][]).map(([label, text]) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">{label}</p>
                      <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg px-3 py-2.5">
                        <p className="text-sm italic text-zinc-200 leading-relaxed">"{text}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ScriptsPage() {
  const [callType, setCallType] = useState<"diagnostic" | "close">("diagnostic");
  const [showObjections, setShowObjections] = useState(false);

  const phases = callType === "diagnostic" ? CALL1 : CALL2;

  return (
    <div className="pt-14 lg:pt-0 px-4 lg:px-8 py-8 max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Call Playbook</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Live reference — follow along during the call</p>
      </div>

      {/* Call type selector */}
      <div className="flex gap-2 mb-8 p-1 bg-[#111318] border border-[#1e2130] rounded-xl w-fit">
        <button
          onClick={() => setCallType("diagnostic")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            callType === "diagnostic"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Call 1 — Diagnostic
        </button>
        <button
          onClick={() => setCallType("close")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            callType === "close"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Call 2 — Close
        </button>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {phases.map((phase, i) => (
          <PhaseCard key={`${callType}-${i}`} phase={phase} defaultOpen={true} />
        ))}
      </div>

      {/* Floating objections button */}
      <button
        onClick={() => setShowObjections(true)}
        className="fixed bottom-6 right-6 lg:right-8 flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 shadow-xl transition-colors text-sm font-medium text-zinc-200"
      >
        <MessageSquare size={15} className="text-violet-400" />
        Objections
      </button>

      {showObjections && <ObjectionsPanel onClose={() => setShowObjections(false)} />}
    </div>
  );
}
