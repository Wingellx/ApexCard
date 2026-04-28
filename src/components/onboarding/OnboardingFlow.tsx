"use client";

import { useActionState, useState, useTransition } from "react";
import {
  CheckCircle2, XCircle, ChevronRight, ArrowRight,
  Sparkles, PhoneCall, Briefcase, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Confetti from "@/components/onboarding/Confetti";
import {
  saveOnboardingProfile,
  saveOnboardingGoals,
  saveOwnerVerificationRequest,
  saveTrackingPreference,
  completeOnboarding,
} from "@/app/onboarding/actions";
import { Activity, CalendarDays } from "lucide-react";

const ROLES = [
  { value: "closer",        label: "Closer"             },
  { value: "setter",        label: "Appointment Setter" },
  { value: "operator",      label: "Growth Operator"    },
  { value: "sales_manager", label: "Sales Manager"      },
];

// ── Progress dots (dynamic count) ────────────────────────────

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i < current   ? "w-2 h-2 bg-indigo-400"  :
            i === current  ? "w-6 h-2 bg-violet-500"  :
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

// ── Step 0: Account type selection ───────────────────────────

type AccountType = "rep" | "owner";

function StepWelcome({ onNext }: { onNext: (type: AccountType) => void }) {
  const [selected, setSelected] = useState<AccountType | null>(null);

  return (
    <div className="animate-in text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center">
        <img src="/logo.svg" alt="ApexCard" className="w-9 h-9" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
        Welcome to ApexCard
      </h1>
      <p className="text-[#6b7280] text-sm mb-8 max-w-sm mx-auto">
        Let us know how you&apos;ll be using ApexCard so we can set up the right experience.
      </p>

      <div className="grid grid-cols-1 gap-3 mb-8 text-left">
        {/* Sales Rep card */}
        <button
          type="button"
          onClick={() => setSelected("rep")}
          className={cn(
            "flex items-start gap-4 p-4 rounded-xl border transition-all duration-150 text-left",
            selected === "rep"
              ? "bg-violet-500/10 border-violet-500/40 ring-1 ring-violet-500/30"
              : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14]"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors",
            selected === "rep" ? "bg-violet-500/20 border border-violet-500/30" : "bg-white/[0.06] border border-white/[0.08]"
          )}>
            <PhoneCall className={cn("w-5 h-5", selected === "rep" ? "text-violet-400" : "text-[#6b7280]")} />
          </div>
          <div className="min-w-0">
            <p className={cn("font-bold text-sm mb-0.5", selected === "rep" ? "text-white" : "text-[#d1d5db]")}>
              Sales Rep
            </p>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              I&apos;m a closer, appointment setter, or operator. I want to track my calls, stats, and performance.
            </p>
          </div>
          <div className={cn(
            "w-4 h-4 rounded-full border-2 shrink-0 mt-1 transition-colors",
            selected === "rep" ? "border-violet-500 bg-violet-500" : "border-[#374151]"
          )} />
        </button>

        {/* Offer Owner card */}
        <button
          type="button"
          onClick={() => setSelected("owner")}
          className={cn(
            "flex items-start gap-4 p-4 rounded-xl border transition-all duration-150 text-left",
            selected === "owner"
              ? "bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30"
              : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14]"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors",
            selected === "owner" ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-white/[0.06] border border-white/[0.08]"
          )}>
            <Briefcase className={cn("w-5 h-5", selected === "owner" ? "text-indigo-400" : "text-[#6b7280]")} />
          </div>
          <div className="min-w-0">
            <p className={cn("font-bold text-sm mb-0.5", selected === "owner" ? "text-white" : "text-[#d1d5db]")}>
              Offer Owner / Sales Manager
            </p>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              I run a sales team or have an offer. I want to find and evaluate sales reps.
            </p>
          </div>
          <div className={cn(
            "w-4 h-4 rounded-full border-2 shrink-0 mt-1 transition-colors",
            selected === "owner" ? "border-indigo-500 bg-indigo-500" : "border-[#374151]"
          )} />
        </button>
      </div>

      <button
        onClick={() => selected && onNext(selected)}
        disabled={!selected}
        className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-violet-500/20"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Rep: Step 1 — Profile ─────────────────────────────────────

function StepProfile({ onNext }: { onNext: () => void }) {
  const [state, formAction, isPending] = useActionState(saveOnboardingProfile, null);
  const [username, setUsername] = useState("");

  const trimmed    = username.trim().toLowerCase();
  const usernameOk = trimmed.length === 0 || /^[a-z0-9_-]{3,30}$/.test(trimmed);

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

// ── Rep: Step 2 — Tracking Preference ────────────────────────

function StepTracking({ onNext }: { onNext: () => void }) {
  const [state, formAction, isPending] = useActionState(saveTrackingPreference, null);
  const [selected, setSelected] = useState<"daily" | "weekly">("daily");

  if (state && !state.error) {
    onNext();
    return null;
  }

  return (
    <div className="animate-in">
      <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight">How do you want to track?</h2>
      <p className="text-sm text-[#6b7280] mb-7">
        Choose how you&apos;ll check in on your performance. You can change this later from your profile.
      </p>

      <div className="grid grid-cols-1 gap-3 mb-7">
        <button
          type="button"
          onClick={() => setSelected("daily")}
          className={cn(
            "flex items-start gap-4 p-4 rounded-xl border transition-all duration-150 text-left",
            selected === "daily"
              ? "bg-violet-500/10 border-violet-500/40 ring-1 ring-violet-500/30"
              : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14]"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors",
            selected === "daily" ? "bg-violet-500/20 border border-violet-500/30" : "bg-white/[0.06] border border-white/[0.08]"
          )}>
            <Activity className={cn("w-5 h-5", selected === "daily" ? "text-violet-400" : "text-[#6b7280]")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("font-bold text-sm mb-0.5", selected === "daily" ? "text-white" : "text-[#d1d5db]")}>
              Daily Tracker
            </p>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              Check in every day. Track daily scores and build a streak. Best for people who want constant feedback.
            </p>
          </div>
          <div className={cn(
            "w-4 h-4 rounded-full border-2 shrink-0 mt-1 transition-colors",
            selected === "daily" ? "border-violet-500 bg-violet-500" : "border-[#374151]"
          )} />
        </button>

        <button
          type="button"
          onClick={() => setSelected("weekly")}
          className={cn(
            "flex items-start gap-4 p-4 rounded-xl border transition-all duration-150 text-left",
            selected === "weekly"
              ? "bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30"
              : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14]"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors",
            selected === "weekly" ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-white/[0.06] border border-white/[0.08]"
          )}>
            <CalendarDays className={cn("w-5 h-5", selected === "weekly" ? "text-indigo-400" : "text-[#6b7280]")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn("font-bold text-sm mb-0.5", selected === "weekly" ? "text-white" : "text-[#d1d5db]")}>
              Weekly Tracker
            </p>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              One check-in per week. Reflect on the full week. Best for people who prefer a weekly review rhythm.
            </p>
          </div>
          <div className={cn(
            "w-4 h-4 rounded-full border-2 shrink-0 mt-1 transition-colors",
            selected === "weekly" ? "border-indigo-500 bg-indigo-500" : "border-[#374151]"
          )} />
        </button>
      </div>

      <form action={formAction}>
        <input type="hidden" name="tracking_preference" value={selected} />
        {state?.error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-4">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="text-sm text-rose-400">{state.error}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          {isPending ? "Saving…" : <>Continue <ChevronRight className="w-4 h-4" /></>}
        </button>
      </form>
    </div>
  );
}

// ── Rep: Step 3 — Goals ───────────────────────────────────────

function StepGoals({ onNext }: { onNext: () => void }) {
  const [state, formAction, isPending] = useActionState(saveOnboardingGoals, null);
  const [, startTransition] = useTransition();

  if (state && !state.error) {
    onNext();
    return null;
  }

  function skip() { startTransition(() => { onNext(); }); }

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

        <button type="submit" disabled={isPending} className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors mt-2">
          {isPending ? "Saving…" : <>Save goals <ChevronRight className="w-4 h-4" /></>}
        </button>
        <button type="button" onClick={skip} className="w-full text-sm text-[#4b5563] hover:text-[#6b7280] transition-colors py-1">
          Skip for now
        </button>
      </form>
    </div>
  );
}

// ── Rep: Step 3 — Done ────────────────────────────────────────

function StepDone() {
  const [isPending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => { await completeOnboarding(); });
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

// ── Owner: Step 1 — Company profile ──────────────────────────

function StepOwnerProfile({ onNext }: { onNext: () => void }) {
  const [state, formAction, isPending] = useActionState(saveOwnerVerificationRequest, null);

  if (state && !state.error) {
    onNext();
    return null;
  }

  return (
    <div className="animate-in">
      <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight">Tell us about your offer</h2>
      <p className="text-sm text-[#6b7280] mb-7">
        We manually review all Offer Owner accounts. This usually takes 1–2 business days.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className={labelClass}>Your full name</label>
          <input name="full_name" type="text" placeholder="Alex Johnson" required className={inputClass} autoFocus />
        </div>
        <div>
          <label className={labelClass}>Company name</label>
          <input name="company_name" type="text" placeholder="Apex Sales Inc." required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Company website <span className="text-[#374151] normal-case font-normal">(optional)</span></label>
          <input name="company_website" type="url" placeholder="https://yourcompany.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Describe your offer or team</label>
          <textarea
            name="offer_description"
            required
            rows={4}
            placeholder="We run a high-ticket solar program with 12 closers. Looking to hire vetted remote closers for a 15% commission structure."
            className={cn(inputClass, "resize-none")}
          />
          <p className="text-[11px] text-[#374151] mt-1.5">What do you sell? How does your team work? Be specific.</p>
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
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors mt-2"
        >
          {isPending ? "Submitting…" : <>Submit for review <ChevronRight className="w-4 h-4" /></>}
        </button>
      </form>
    </div>
  );
}

// ── Owner: Step 2 — Pending ───────────────────────────────────

function StepOwnerPending() {
  const [isPending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => { await completeOnboarding(); });
  }

  return (
    <div className="animate-in text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
        <Clock className="w-8 h-8 text-indigo-400" />
      </div>
      <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Application submitted</h2>
      <p className="text-[#6b7280] text-base leading-relaxed mb-2 max-w-sm mx-auto">
        We&apos;ve received your request and will review it within 1–2 business days.
      </p>
      <p className="text-[#4b5563] text-sm mb-10 max-w-xs mx-auto">
        You&apos;ll receive an email when your account is approved and you can access the portal.
      </p>
      <button
        onClick={handleComplete}
        disabled={isPending}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
      >
        {isPending ? "Loading…" : <>Go to portal <ArrowRight className="w-4 h-4" /></>}
      </button>
    </div>
  );
}

// ── Main flow ─────────────────────────────────────────────────

export default function OnboardingFlow({ showTracking = false }: { showTracking?: boolean }) {
  const [step, setStep]               = useState(0);
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  // Tracking step only shown for improvement community (IO) members
  const repStepCount   = showTracking ? 5 : 4; // Welcome, Profile, [Tracking], Goals, Done
  const ownerStepCount = 3; // Welcome, Details, Pending
  const totalSteps     = accountType === "owner" ? ownerStepCount : repStepCount;

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-2 mb-12">
          <img src="/logo.svg" alt="ApexCard" className="w-6 h-6 opacity-40" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">ApexCard</span>
        </div>

        <ProgressDots current={step} total={totalSteps} />

        {step === 0 && (
          <StepWelcome onNext={(type) => { setAccountType(type); setStep(1); }} />
        )}

        {/* Sales Rep path */}
        {accountType === "rep" && step === 1 && (
          <StepProfile onNext={() => setStep(2)} />
        )}
        {accountType === "rep" && step === 2 && showTracking && (
          <StepTracking onNext={() => setStep(3)} />
        )}
        {accountType === "rep" && step === 2 && !showTracking && (
          <StepGoals onNext={() => setStep(3)} />
        )}
        {accountType === "rep" && step === 3 && showTracking && (
          <StepGoals onNext={() => setStep(4)} />
        )}
        {accountType === "rep" && step === 3 && !showTracking && (
          <StepDone />
        )}
        {accountType === "rep" && step === 4 && <StepDone />}

        {/* Offer Owner path */}
        {accountType === "owner" && step === 1 && <StepOwnerProfile onNext={() => setStep(2)} />}
        {accountType === "owner" && step === 2 && <StepOwnerPending />}
      </div>
    </div>
  );
}
