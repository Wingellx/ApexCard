"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckCircle2, XCircle, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Confetti from "@/components/onboarding/Confetti";
import {
  saveOnboardingProfile,
  saveOnboardingGoals,
  completeOnboarding,
} from "@/app/onboarding/actions";

const ROLES = [
  { value: "closer",   label: "Closer"             },
  { value: "setter",   label: "Appointment Setter" },
  { value: "operator", label: "Growth Operator"    },
  { value: "manager",  label: "Sales Manager"      },
];

const STEPS = ["Welcome", "Profile", "Goals", "Done"];

function ProgressDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i < current  ? "w-2 h-2 bg-indigo-400"       :
            i === current ? "w-6 h-2 bg-violet-500"       :
                            "w-2 h-2 bg-white/10"
          )}
        />
      ))}
    </div>
  );
}

const inputClass =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#4b5563] focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/40 transition-colors";
const labelClass =
  "block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5";

// ── Step 1: Welcome ──────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="animate-in text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center">
        <img src="/logo.svg" alt="ApexCard" className="w-9 h-9" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
        Welcome to ApexCard
      </h1>
      <p className="text-[#6b7280] text-base leading-relaxed mb-2 max-w-sm mx-auto">
        Your verified sales identity. Track performance, get manager-verified, and share your stats card.
      </p>
      <p className="text-[#4b5563] text-sm mb-10">Let&apos;s get you set up — takes about 2 minutes.</p>
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-violet-500/20"
      >
        Let&apos;s go <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Step 2: Profile ──────────────────────────────────────────────────────────

function StepProfile({ onNext }: { onNext: () => void }) {
  const [state, formAction, isPending] = useActionState(saveOnboardingProfile, null);
  const [username, setUsername] = useState("");

  const trimmed      = username.trim().toLowerCase();
  const usernameOk   = trimmed.length === 0 || /^[a-z0-9_-]{3,30}$/.test(trimmed);

  if (state && !state.error) {
    onNext();
    return null;
  }

  return (
    <div className="animate-in">
      <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight">Set up your profile</h2>
      <p className="text-sm text-[#6b7280] mb-7">This is how you&apos;ll appear on the leaderboard and your stats card.</p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className={labelClass}>Your name</label>
          <input name="full_name" type="text" placeholder="Alex Johnson" required className={inputClass} autoFocus />
        </div>

        <div>
          <label className={labelClass}>Username <span className="text-[#374151] normal-case font-normal">(optional)</span></label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#4b5563] pointer-events-none">@</span>
            <input
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              placeholder="alexjohnson"
              maxLength={30}
              className={cn(inputClass, "pl-8", !usernameOk && "border-rose-500/50 focus:border-rose-500/60 focus:ring-rose-500/40")}
            />
          </div>
          <p className="text-[11px] text-[#374151] mt-1.5">Your public card URL: apexcard.co/card/username</p>
        </div>

        <div>
          <label className={labelClass}>Your role</label>
          <select name="role" className={cn(inputClass, "cursor-pointer")}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {state?.error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-400">{state.error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !usernameOk}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors mt-2"
        >
          {isPending ? "Saving…" : <>Continue <ChevronRight className="w-4 h-4" /></>}
        </button>
      </form>
    </div>
  );
}

// ── Step 3: Goals ────────────────────────────────────────────────────────────

function StepGoals({ onNext }: { onNext: () => void }) {
  const [state, formAction, isPending] = useActionState(saveOnboardingGoals, null);
  const [, startTransition] = useTransition();

  if (state && !state.error) {
    onNext();
    return null;
  }

  function skip() {
    startTransition(() => { onNext(); });
  }

  return (
    <div className="animate-in">
      <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight">Set your first goals</h2>
      <p className="text-sm text-[#6b7280] mb-7">What are you aiming for this month? You can change these anytime.</p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className={labelClass}>Monthly cash target</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#4b5563] pointer-events-none">$</span>
            <input name="cash_target" type="number" min="0" step="100" placeholder="10,000" className={cn(inputClass, "pl-8")} autoFocus />
          </div>
        </div>

        <div>
          <label className={labelClass}>Monthly calls target</label>
          <input name="calls_target" type="number" min="0" step="1" placeholder="200" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Close rate target <span className="text-[#374151] normal-case font-normal">(%)</span></label>
          <div className="relative">
            <input name="close_rate" type="number" min="0" max="100" step="0.5" placeholder="30" className={cn(inputClass, "pr-8")} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#4b5563] pointer-events-none">%</span>
          </div>
        </div>

        {state?.error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-400">{state.error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors mt-2"
        >
          {isPending ? "Saving…" : <>Save goals <ChevronRight className="w-4 h-4" /></>}
        </button>

        <button type="button" onClick={skip} className="w-full text-sm text-[#4b5563] hover:text-[#6b7280] transition-colors py-1">
          Skip for now
        </button>
      </form>
    </div>
  );
}

// ── Step 4: Done ─────────────────────────────────────────────────────────────

function StepDone() {
  const [isPending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => {
      await completeOnboarding();
    });
  }

  return (
    <div className="animate-in text-center">
      <Confetti />
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <h2 className="text-3xl font-black text-white mb-3 tracking-tight">You&apos;re all set!</h2>
      <p className="text-[#6b7280] text-base leading-relaxed mb-2 max-w-sm mx-auto">
        Your ApexCard is ready. Start logging calls, track your performance, and share your stats with the world.
      </p>
      <div className="flex items-center justify-center gap-2 mb-10">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <p className="text-sm text-amber-400 font-medium">First log unlocks your public stats card</p>
      </div>
      <button
        onClick={handleComplete}
        disabled={isPending}
        className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-violet-500/20"
      >
        {isPending ? "Loading…" : <>Go to Dashboard <ArrowRight className="w-4 h-4" /></>}
      </button>
    </div>
  );
}

// ── Main flow ─────────────────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* ApexCard wordmark */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <img src="/logo.svg" alt="ApexCard" className="w-6 h-6 opacity-40" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">ApexCard</span>
        </div>

        <ProgressDots current={step} />

        {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
        {step === 1 && <StepProfile onNext={() => setStep(2)} />}
        {step === 2 && <StepGoals   onNext={() => setStep(3)} />}
        {step === 3 && <StepDone />}
      </div>
    </div>
  );
}
