"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import {
  Briefcase, Star, Lock, CheckCircle2, AlertCircle, Bookmark,
  BookmarkCheck, ShieldCheck, X, ChevronRight, Loader2, Send,
  CheckCheck, Building2, Tag, Percent, Users, Clock,
  TrendingUp, DollarSign, CalendarDays, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitApplication, toggleSavedOffer } from "./application-actions";
import type { Offer, UserEligibility, OfferApplication, B2BorB2C } from "@/lib/offers-queries";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "closing" | "dm_setter" | "dialling" | "saved";
type B2BFilter = "all" | "b2b" | "b2c";
type ModalView = "detail" | "apply" | "success";
type EligibilityState = "eligible" | "almost" | "locked";

interface UserStats {
  name: string;
  role: string | null;
  username: string | null;
  isVerified: boolean;
  verificationActive: boolean;
}

interface Props {
  offers: Offer[];
  eligibility: UserEligibility;
  savedOfferIds: string[];
  myApplications: OfferApplication[];
  userStats: UserStats;
  userId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const ROLE_LABELS: Record<string, string> = {
  dm_setter: "DM Setter",
  dialling:  "Dialling",
  closing:   "Closing",
};

const ROLE_LABELS_USER: Record<string, string> = {
  closer: "Closer", setter: "Appointment Setter", operator: "Growth Operator",
  manager: "Sales Manager", sdr: "SDR", ae: "Account Executive",
  dm_setter: "DM Setter",
};

function daysUntil(isoDate: string): number {
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000));
}

function getEligibilityState(offer: Offer, elig: UserEligibility): EligibilityState {
  let hasHard  = false;
  let hasAlmost = false;

  if (offer.requires_verified && !(elig.isVerified && elig.verificationActive)) {
    hasHard = true;
  }
  if (offer.min_cash_collected !== null && elig.lifetimeCash < offer.min_cash_collected) {
    const pct = offer.min_cash_collected > 0 ? elig.lifetimeCash / offer.min_cash_collected : 0;
    if (pct >= 0.8) hasAlmost = true; else hasHard = true;
  }
  if (offer.min_close_rate !== null && elig.closeRate < offer.min_close_rate) {
    const pct = offer.min_close_rate > 0 ? elig.closeRate / offer.min_close_rate : 0;
    if (pct >= 0.8) hasAlmost = true; else hasHard = true;
  }

  if (hasHard)  return "locked";
  if (hasAlmost) return "almost";
  return "eligible";
}

interface RequirementLine {
  label: string;
  met: boolean;
  almost: boolean;
}

function getRequirementLines(offer: Offer, elig: UserEligibility): RequirementLine[] {
  const lines: RequirementLine[] = [];

  if (offer.requires_verified) {
    const met = elig.isVerified && elig.verificationActive;
    lines.push({ label: "Verified badge required", met, almost: false });
  }
  if (offer.min_cash_collected !== null) {
    const met    = elig.lifetimeCash >= offer.min_cash_collected;
    const pct    = offer.min_cash_collected > 0 ? elig.lifetimeCash / offer.min_cash_collected : 0;
    const almost = !met && pct >= 0.8;
    lines.push({
      label: `${fmt(offer.min_cash_collected)} lifetime cash collected${!met ? ` — you have ${fmt(elig.lifetimeCash)}` : ""}`,
      met,
      almost,
    });
  }
  if (offer.min_close_rate !== null) {
    const met    = elig.closeRate >= offer.min_close_rate;
    const pct    = offer.min_close_rate > 0 ? elig.closeRate / offer.min_close_rate : 0;
    const almost = !met && pct >= 0.8;
    lines.push({
      label: `${offer.min_close_rate}% close rate${!met ? ` — yours is ${elig.closeRate.toFixed(1)}%` : ""}`,
      met,
      almost,
    });
  }
  return lines;
}

// ── B2B/B2C badge ─────────────────────────────────────────────────────────────

function B2CBadge({ value }: { value: B2BorB2C | null }) {
  if (!value) return null;
  const cfg: Record<B2BorB2C, { label: string; cls: string }> = {
    b2b:  { label: "B2B",  cls: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"   },
    b2c:  { label: "B2C",  cls: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    both: { label: "B2B + B2C", cls: "text-blue-400 bg-blue-500/10 border-blue-500/20"  },
  };
  const c = cfg[value];
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", c.cls)}>
      {c.label}
    </span>
  );
}

// ── Eligibility icon ──────────────────────────────────────────────────────────

function EligIcon({ state, className }: { state: EligibilityState; className?: string }) {
  if (state === "eligible") return <CheckCircle2 className={cn("w-4 h-4 text-emerald-400", className)} />;
  if (state === "almost")   return <AlertCircle  className={cn("w-4 h-4 text-amber-400",   className)} />;
  return <Lock className={cn("w-4 h-4 text-rose-400", className)} />;
}

// ── Offer card ────────────────────────────────────────────────────────────────

function OfferCard({
  offer,
  eligState,
  isSaved,
  hasApplied,
  onOpen,
  onToggleSave,
  savePending,
}: {
  offer:         Offer;
  eligState:     EligibilityState;
  isSaved:       boolean;
  hasApplied:    boolean;
  onOpen:        () => void;
  onToggleSave:  (e: React.MouseEvent) => void;
  savePending:   boolean;
}) {
  const isFull = offer.application_count >= offer.application_limit;
  const pctFull = offer.application_limit > 0
    ? Math.min(100, Math.round((offer.application_count / offer.application_limit) * 100))
    : 0;

  return (
    <div
      onClick={onOpen}
      className={cn(
        "group relative bg-[#0f1117] border rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:bg-[#111520] hover:shadow-lg hover:shadow-black/20",
        eligState === "eligible" ? "border-[#1e2130] hover:border-emerald-500/20" :
        eligState === "almost"   ? "border-[#1e2130] hover:border-amber-500/20"   :
                                   "border-[#1e2130] hover:border-[#2a2f48]"
      )}
    >
      {/* Top row: featured badge + bookmark */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
            "text-[#4b5563] bg-white/[0.02] border-[#1e2130]"
          )}>
            {ROLE_LABELS[offer.role_type] ?? offer.role_type}
          </span>
          {offer.is_featured && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
            </span>
          )}
        </div>
        <button
          onClick={onToggleSave}
          disabled={savePending}
          className="p-1.5 rounded-lg text-[#374151] hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
          aria-label={isSaved ? "Remove from saved" : "Save offer"}
        >
          {isSaved
            ? <BookmarkCheck className="w-4 h-4 text-cyan-400" />
            : <Bookmark className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Title + company */}
      <h3 className="text-sm font-bold text-[#f0f2f8] leading-snug mb-1 group-hover:text-white transition-colors line-clamp-2">
        {offer.title}
      </h3>
      <p className="text-xs font-semibold text-cyan-400/80 mb-3">{offer.company_name}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[10px] font-semibold text-[#6b7280] bg-white/[0.03] border border-[#1e2130] px-2 py-0.5 rounded-full">
          {offer.niche}
        </span>
        <B2CBadge value={offer.b2b_b2c} />
      </div>

      {/* Commission / base pay */}
      <div className="flex items-center gap-3 mb-4">
        {offer.commission_pct !== null && (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Percent className="w-3 h-3" />
            <span className="text-xs font-bold tabular-nums">{offer.commission_pct}% commission</span>
          </div>
        )}
        {offer.base_pay !== null && (
          <div className="flex items-center gap-1.5 text-[#9ca3af]">
            <DollarSign className="w-3 h-3" />
            <span className="text-xs font-semibold tabular-nums">{fmt(offer.base_pay)}/mo base</span>
          </div>
        )}
      </div>

      {/* Eligibility + apply status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <EligIcon state={eligState} />
          <span className={cn(
            "text-[11px] font-semibold",
            eligState === "eligible" ? "text-emerald-400" :
            eligState === "almost"   ? "text-amber-400"   : "text-rose-400"
          )}>
            {eligState === "eligible" ? "Eligible" : eligState === "almost" ? "Almost eligible" : "Requirements not met"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasApplied && (
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
              Applied
            </span>
          )}
          {isFull && (
            <span className="text-[10px] font-bold text-[#6b7280] bg-white/[0.03] border border-[#1e2130] px-2 py-0.5 rounded-full">
              Full
            </span>
          )}
          {!isFull && pctFull >= 80 && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {100 - pctFull}% left
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stats preview (in apply modal) ───────────────────────────────────────────

function StatsPreview({ stats, eligibility }: { stats: UserStats; eligibility: UserEligibility }) {
  return (
    <div className="bg-[#080a0e] border border-[#1e2130] rounded-xl overflow-hidden">
      <div className="bg-[#0f1117] border-b border-[#1e2130] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#f0f2f8]">{stats.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {stats.role && (
              <span className="text-[11px] text-[#4b5563]">{ROLE_LABELS_USER[stats.role] ?? stats.role}</span>
            )}
            {stats.isVerified && stats.verificationActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
        </div>
        {stats.username && (
          <span className="text-[11px] text-[#374151]">@{stats.username}</span>
        )}
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#1e2130] px-0">
        <div className="px-4 py-3 text-center">
          <p className="text-sm font-extrabold text-emerald-400 tabular-nums">{fmt(eligibility.lifetimeCash)}</p>
          <p className="text-[10px] text-[#374151] mt-0.5">Cash Collected</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-sm font-extrabold text-indigo-400 tabular-nums">{eligibility.closeRate.toFixed(1)}%</p>
          <p className="text-[10px] text-[#374151] mt-0.5">Close Rate</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-sm font-extrabold text-[#9ca3af] tabular-nums">{eligibility.daysLogged}</p>
          <p className="text-[10px] text-[#374151] mt-0.5">Days Logged</p>
        </div>
      </div>
    </div>
  );
}

// ── Offer detail modal ────────────────────────────────────────────────────────

function OfferDetailModal({
  offer,
  eligibility,
  view,
  setView,
  onClose,
  isSaved,
  onToggleSave,
  hasApplied,
  userStats,
}: {
  offer:        Offer;
  eligibility:  UserEligibility;
  view:         ModalView;
  setView:      (v: ModalView) => void;
  onClose:      () => void;
  isSaved:      boolean;
  onToggleSave: (e: React.MouseEvent) => void;
  hasApplied:   boolean;
  userStats:    UserStats;
}) {
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const overlayRef = useRef<HTMLDivElement>(null);
  const eligState  = getEligibilityState(offer, eligibility);
  const reqLines   = getRequirementLines(offer, eligibility);
  const isFull     = offer.application_count >= offer.application_limit;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit() {
    setSubmitErr(null);
    startTransition(async () => {
      const result = await submitApplication(offer.id);
      if (result.error) { setSubmitErr(result.error); return; }
      setView("success");
    });
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-xl bg-[#0f1117] border border-[#1e2130] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* ── Success view ─────────────────────────────── */}
        {view === "success" && (
          <div className="flex flex-col items-center justify-center p-10 text-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-[#f0f2f8] mb-2">Application submitted</p>
              <p className="text-sm text-[#6b7280] leading-relaxed">
                The offer owner has been notified with your ApexCard stats.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white/[0.04] hover:bg-white/[0.08] text-[#9ca3af] border border-[#1e2130] transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {/* ── Apply view ───────────────────────────────── */}
        {view === "apply" && (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2130]">
              <button onClick={() => setView("detail")} className="text-[#4b5563] hover:text-[#9ca3af] transition-colors">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <p className="text-sm font-bold text-[#f0f2f8]">Apply to this role</p>
              <button onClick={onClose} className="text-[#374151] hover:text-[#9ca3af] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              <div>
                <p className="text-xs font-bold text-[#4b5563] uppercase tracking-widest mb-1">Applying to</p>
                <p className="text-sm font-bold text-[#f0f2f8]">{offer.title}</p>
                <p className="text-xs text-cyan-400/80">{offer.company_name}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-[#4b5563] uppercase tracking-widest mb-2">
                  This will be sent to the offer owner
                </p>
                <StatsPreview stats={userStats} eligibility={eligibility} />
              </div>

              {submitErr && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  <p className="text-xs text-rose-400">{submitErr}</p>
                </div>
              )}
            </div>
            <div className="px-5 pb-5 pt-3 border-t border-[#1e2130]">
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isPending ? "Submitting…" : "Submit Application"}
              </button>
            </div>
          </>
        )}

        {/* ── Detail view ──────────────────────────────── */}
        {view === "detail" && (
          <>
            {/* Header */}
            <div className="flex items-start gap-3 px-5 py-5 border-b border-[#1e2130]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {offer.is_featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-[#4b5563] bg-white/[0.02] border border-[#1e2130] px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[offer.role_type] ?? offer.role_type}
                  </span>
                  <B2CBadge value={offer.b2b_b2c} />
                  {offer.requires_verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-2.5 h-2.5" /> Verified only
                    </span>
                  )}
                </div>
                <h2 className="text-base font-extrabold text-[#f0f2f8] leading-snug mb-1">{offer.title}</h2>
                <p className="text-sm font-semibold text-cyan-400/80">{offer.company_name}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={onToggleSave}
                  className="p-2 rounded-xl text-[#374151] hover:text-cyan-400 hover:bg-cyan-500/10 border border-[#1e2130] hover:border-cyan-500/20 transition-colors"
                  aria-label={isSaved ? "Remove from saved" : "Save offer"}
                >
                  {isSaved ? <BookmarkCheck className="w-4 h-4 text-cyan-400" /> : <Bookmark className="w-4 h-4" />}
                </button>
                <button onClick={onClose} className="p-2 rounded-xl text-[#374151] hover:text-[#9ca3af] border border-[#1e2130] hover:border-[#2a2f48] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
              {/* Meta row */}
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-[11px] text-[#6b7280]">
                  <Tag className="w-3 h-3" /> {offer.niche}
                </span>
                {offer.commission_pct !== null && (
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                    <Percent className="w-3 h-3" /> {offer.commission_pct}% commission
                  </span>
                )}
                {offer.base_pay !== null && (
                  <span className="flex items-center gap-1.5 text-[11px] text-[#9ca3af]">
                    <DollarSign className="w-3 h-3" /> {fmt(offer.base_pay)}/mo base
                  </span>
                )}
                {offer.expires_at && (
                  <span className="flex items-center gap-1.5 text-[11px] text-[#4b5563]">
                    <Clock className="w-3 h-3" /> Closes {new Date(offer.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>

              {/* Spots remaining */}
              {offer.application_limit > 0 && (
                <div className="bg-white/[0.02] border border-[#1e2130] rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#4b5563]" />
                    <span className="text-xs text-[#6b7280]">
                      {isFull
                        ? "Applications closed"
                        : `${offer.application_limit - offer.application_count} of ${offer.application_limit} spots remaining`
                      }
                    </span>
                  </div>
                  <div className="w-24 h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", isFull ? "bg-rose-500" : "bg-indigo-500")}
                      style={{ width: `${Math.min(100, (offer.application_count / offer.application_limit) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              {offer.description && (
                <div>
                  <p className="text-[10px] font-bold text-[#4b5563] uppercase tracking-widest mb-2">About this role</p>
                  <p className="text-sm text-[#9ca3af] leading-relaxed whitespace-pre-wrap">{offer.description}</p>
                </div>
              )}

              {/* Requirements text */}
              {offer.requirements && (
                <div>
                  <p className="text-[10px] font-bold text-[#4b5563] uppercase tracking-widest mb-2">What they're looking for</p>
                  <p className="text-sm text-[#9ca3af] leading-relaxed whitespace-pre-wrap">{offer.requirements}</p>
                </div>
              )}

              {/* Eligibility checklist */}
              {reqLines.length > 0 && (
                <div className="bg-white/[0.02] border border-[#1e2130] rounded-xl p-4">
                  <p className="text-[10px] font-bold text-[#4b5563] uppercase tracking-widest mb-3">Your eligibility</p>
                  <div className="space-y-2.5">
                    {reqLines.map((line, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        {line.met
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          : line.almost
                            ? <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            : <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        }
                        <span className={cn(
                          "text-sm leading-snug",
                          line.met ? "text-[#9ca3af]" : line.almost ? "text-amber-400/90" : "text-rose-400/90"
                        )}>
                          {line.label}
                          {line.almost && <span className="text-[11px] text-amber-500/70 block">You're close — almost there</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer CTA */}
            <div className="px-5 pb-5 pt-3 border-t border-[#1e2130]">
              {hasApplied ? (
                <div className="w-full py-3 rounded-xl text-sm font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 text-center">
                  <CheckCircle2 className="w-4 h-4 inline mr-2" />
                  Application submitted
                </div>
              ) : isFull ? (
                <div className="w-full py-3 rounded-xl text-sm font-bold text-[#4b5563] bg-white/[0.02] border border-[#1e2130] text-center">
                  Applications closed
                </div>
              ) : eligState === "locked" ? (
                <div className="w-full py-3 rounded-xl text-sm font-bold text-rose-400/70 bg-rose-500/5 border border-rose-500/10 text-center">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Requirements not met
                </div>
              ) : (
                <button
                  onClick={() => setView("apply")}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200",
                    eligState === "eligible"
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:border-amber-400/40"
                  )}
                >
                  <Briefcase className="w-4 h-4" />
                  Apply Now
                  {eligState === "almost" && <span className="text-[11px] opacity-70">(almost eligible)</span>}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main board component ──────────────────────────────────────────────────────

export default function OfferBoard({
  offers,
  eligibility,
  savedOfferIds,
  myApplications,
  userStats,
}: Props) {
  const [tab,          setTab]          = useState<Tab>("closing");
  const [b2bFilter,    setB2bFilter]    = useState<B2BFilter>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [modalView,    setModalView]    = useState<ModalView>("detail");
  const [savedIds,     setSavedIds]     = useState<Set<string>>(() => new Set(savedOfferIds));
  const [savingIds,    setSavingIds]    = useState<Set<string>>(new Set());
  const [, startTransition]             = useTransition();

  const appliedOfferIds = useMemo(
    () => new Set(myApplications.map(a => a.offer_id)),
    [myApplications]
  );

  const tabCounts = useMemo(() => ({
    closing:   offers.filter(o => o.role_type === "closing").length,
    dm_setter: offers.filter(o => o.role_type === "dm_setter").length,
    dialling:  offers.filter(o => o.role_type === "dialling").length,
    saved:     savedIds.size,
  }), [offers, savedIds]);

  const filteredOffers = useMemo(() => {
    let base = tab === "saved"
      ? offers.filter(o => savedIds.has(o.id))
      : offers.filter(o => o.role_type === tab);

    if (b2bFilter !== "all") {
      base = base.filter(o => !o.b2b_b2c || o.b2b_b2c === b2bFilter || o.b2b_b2c === "both");
    }
    if (verifiedOnly) {
      base = base.filter(o => o.requires_verified);
    }
    if (eligibleOnly) {
      base = base.filter(o => getEligibilityState(o, eligibility) === "eligible");
    }
    return base;
  }, [offers, tab, b2bFilter, verifiedOnly, eligibleOnly, savedIds, eligibility]);

  function openOffer(offer: Offer) {
    setSelectedOffer(offer);
    setModalView("detail");
  }

  function closeModal() {
    setSelectedOffer(null);
  }

  function handleToggleSave(e: React.MouseEvent, offer: Offer) {
    e.stopPropagation();
    const isSaved = savedIds.has(offer.id);
    setSavedIds(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(offer.id); else next.add(offer.id);
      return next;
    });
    setSavingIds(prev => new Set(prev).add(offer.id));
    startTransition(async () => {
      await toggleSavedOffer(offer.id, isSaved);
      setSavingIds(prev => { const next = new Set(prev); next.delete(offer.id); return next; });
    });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "closing",   label: "Closing"    },
    { key: "dm_setter", label: "DM Setting" },
    { key: "dialling",  label: "Dialling"   },
    { key: "saved",     label: "Saved"      },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-extrabold text-[#f0f2f8] tracking-tight">Offer Board</h1>
          <p className="text-sm text-[#4b5563] mt-0.5">{offers.length} active role{offers.length !== 1 ? "s" : ""}</p>
        </div>
        <a
          href="/dashboard/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4b5563] hover:text-indigo-400 border border-[#1e2130] hover:border-indigo-500/30 px-3 py-2 rounded-lg transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          My Applications
          {myApplications.length > 0 && (
            <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {myApplications.length}
            </span>
          )}
        </a>
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        {/* Role type tabs */}
        <div className="flex bg-[#0f1117] border border-[#1e2130] rounded-xl p-1 gap-0.5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                tab === t.key
                  ? "bg-indigo-600 text-white shadow"
                  : "text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.03]"
              )}
            >
              {t.label}
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                tab === t.key ? "bg-white/20 text-white" : "bg-white/[0.04] text-[#374151]"
              )}>
                {tabCounts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* B2B/B2C filter */}
        <div className="flex bg-[#0f1117] border border-[#1e2130] rounded-xl p-1 gap-0.5">
          {(["all", "b2b", "b2c"] as const).map(v => (
            <button
              key={v}
              onClick={() => setB2bFilter(v)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                b2bFilter === v
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-[#4b5563] hover:text-[#9ca3af]"
              )}
            >
              {v === "all" ? "All" : v.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setVerifiedOnly(v => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors",
              verifiedOnly
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                : "text-[#4b5563] bg-[#0f1117] border-[#1e2130] hover:text-[#9ca3af]"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Only
          </button>
          <button
            onClick={() => setEligibleOnly(v => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors",
              eligibleOnly
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : "text-[#4b5563] bg-[#0f1117] border-[#1e2130] hover:text-[#9ca3af]"
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Eligible Only
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredOffers.length === 0 ? (
        <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl py-20 text-center">
          <Briefcase className="w-10 h-10 text-[#1e2130] mx-auto mb-4" />
          <p className="text-sm font-semibold text-[#374151]">
            {tab === "saved" ? "No saved offers" : "No offers match your filters"}
          </p>
          <p className="text-xs text-[#2d3147] mt-1">
            {tab === "saved" ? "Bookmark an offer to save it for later." : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map(offer => (
            <OfferCard
              key={offer.id}
              offer={offer}
              eligState={getEligibilityState(offer, eligibility)}
              isSaved={savedIds.has(offer.id)}
              hasApplied={appliedOfferIds.has(offer.id)}
              onOpen={() => openOffer(offer)}
              onToggleSave={(e) => handleToggleSave(e, offer)}
              savePending={savingIds.has(offer.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer}
          eligibility={eligibility}
          view={modalView}
          setView={setModalView}
          onClose={closeModal}
          isSaved={savedIds.has(selectedOffer.id)}
          onToggleSave={(e) => handleToggleSave(e, selectedOffer)}
          hasApplied={appliedOfferIds.has(selectedOffer.id)}
          userStats={userStats}
        />
      )}
    </div>
  );
}
