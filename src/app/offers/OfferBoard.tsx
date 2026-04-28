"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase, Star, X, Copy, Check, ExternalLink,
  ChevronDown, ArrowLeft, Lock, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Offer, OfferRoleType, UserEligibility } from "@/lib/offers-queries";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function getUnmetRequirements(offer: Offer, eligibility: UserEligibility): string[] {
  const unmet: string[] = [];
  if (offer.requires_verified && !(eligibility.isVerified && eligibility.verificationActive)) {
    unmet.push("Verification required");
  }
  if (offer.min_cash_collected !== null && eligibility.lifetimeCash < offer.min_cash_collected) {
    unmet.push(`${fmt(offer.min_cash_collected)} minimum cash collected — your total: ${fmt(eligibility.lifetimeCash)}`);
  }
  if (offer.min_close_rate !== null && eligibility.closeRate < offer.min_close_rate) {
    unmet.push(`${offer.min_close_rate.toFixed(0)}% minimum close rate — yours: ${eligibility.closeRate.toFixed(1)}%`);
  }
  return unmet;
}

// ── Branding ─────────────────────────────────────────────────────

function ApexCardLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="ApexCard" className="w-7 h-7" />
      <span className="text-[17px] font-black text-[#f0f2f8] tracking-tight">ApexCard</span>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────

const ROLE_LABELS: Record<OfferRoleType, string> = {
  dm_setter: "DM Setter",
  dialling:  "Dialling",
  closing:   "Closing",
};

const ROLE_ORDER: OfferRoleType[] = ["dm_setter", "dialling", "closing"];

const SECTION_COLORS: Record<OfferRoleType, {
  accent: string;
  niche:  string;
  bar:    string;
  border: string;
  applyBtn: string;
}> = {
  dm_setter: {
    accent:   "text-cyan-400",
    niche:    "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20",
    bar:      "from-cyan-400 to-cyan-600",
    border:   "border-cyan-500/25",
    applyBtn: "from-cyan-500/10 to-cyan-700/10 text-cyan-300 border-cyan-500/20 hover:from-cyan-500/20 hover:to-cyan-700/20 hover:border-cyan-400/40",
  },
  dialling: {
    accent:   "text-blue-400",
    niche:    "bg-blue-500/10 text-blue-300 border border-blue-500/20",
    bar:      "from-blue-400 to-blue-600",
    border:   "border-blue-500/25",
    applyBtn: "from-blue-500/10 to-blue-700/10 text-blue-300 border-blue-500/20 hover:from-blue-500/20 hover:to-blue-700/20 hover:border-blue-400/40",
  },
  closing: {
    accent:   "text-indigo-400",
    niche:    "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20",
    bar:      "from-indigo-400 to-indigo-600",
    border:   "border-indigo-500/25",
    applyBtn: "from-indigo-500/10 to-indigo-700/10 text-indigo-300 border-indigo-500/20 hover:from-indigo-500/20 hover:to-indigo-700/20 hover:border-indigo-400/40",
  },
};

const FILTER_PILLS = ["Experience Level", "Region", "Role Type"];

// ── Offer card ────────────────────────────────────────────────────

function OfferCard({
  offer,
  eligibility,
  onApply,
}: {
  offer: Offer;
  eligibility: UserEligibility;
  onApply: (o: Offer) => void;
}) {
  const c    = SECTION_COLORS[offer.role_type];
  const unmet = getUnmetRequirements(offer, eligibility);
  const locked = unmet.length > 0;

  return (
    <div
      className={cn(
        "bg-[#07090f] border rounded-2xl p-5 flex flex-col gap-4 hover:bg-[#090c14] transition-colors",
        offer.is_featured ? c.border : "border-[#0f1523]"
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-1">
        {offer.is_featured && (
          <span className="w-fit inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
            <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
          </span>
        )}
        <div className="flex items-start gap-2">
          <h3 className="flex-1 text-[13px] font-bold text-[#f0f2f8] leading-snug">{offer.title}</h3>
          {offer.requires_verified && (
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" aria-label="Verified reps only" />
          )}
        </div>
        <p className={cn("text-[11px] font-semibold", c.accent)}>{offer.company_name}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", c.niche)}>
          {offer.niche}
        </span>
        {offer.commission_pct !== null && (
          <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {offer.commission_pct}% commission
          </span>
        )}
        {offer.base_pay !== null && (
          <span className="text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full">
            Base + commission
          </span>
        )}
      </div>

      {/* Locked state or Apply button */}
      {locked ? (
        <div className="mt-auto space-y-2">
          <div className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#0d0f15] border border-[#1a1d28] text-[#374151] flex items-center justify-center gap-2 cursor-not-allowed select-none">
            <Lock className="w-3 h-3" /> Requirements not met
          </div>
          <div className="space-y-1">
            {unmet.map((req, i) => (
              <p key={i} className="text-[10px] text-[#4b5563] leading-snug flex items-start gap-1.5">
                <span className="text-rose-500 shrink-0 mt-0.5">✕</span>
                {req}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => onApply(offer)}
          className={cn(
            "mt-auto w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r border transition-all duration-200",
            c.applyBtn
          )}
        >
          Apply Now →
        </button>
      )}
    </div>
  );
}

// ── Apply modal ───────────────────────────────────────────────────

function ApplyModal({
  offer,
  userUsername,
  onClose,
}: {
  offer: Offer;
  userUsername: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const c = SECTION_COLORS[offer.role_type];

  const profileUrl = userUsername
    ? `https://apexcard.app/card/${userUsername}`
    : null;

  function copyLink() {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#06080e] border border-[#151c2e] rounded-2xl shadow-2xl shadow-blue-900/20">
        {/* Top accent */}
        <div className="h-[2px] rounded-t-2xl bg-gradient-to-r from-violet-500 to-indigo-600" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              {offer.is_featured && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full mb-2">
                  <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
                </span>
              )}
              <h2 className="text-lg font-extrabold text-[#f0f2f8] tracking-tight leading-snug">
                {offer.title}
              </h2>
              <p className={cn("text-sm font-semibold mt-0.5", c.accent)}>
                {offer.company_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-2 rounded-xl text-[#4b5563] hover:text-[#9ca3af] hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", c.niche)}>
              {ROLE_LABELS[offer.role_type]}
            </span>
            <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", c.niche)}>
              {offer.niche}
            </span>
            {offer.commission_pct !== null && (
              <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                {offer.commission_pct}% commission
              </span>
            )}
            {offer.base_pay !== null && (
              <span className="text-[11px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2.5 py-1 rounded-full">
                Base + commission
              </span>
            )}
          </div>

          {/* Description */}
          {offer.description && (
            <div className="mb-5">
              <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest mb-2">
                About this role
              </p>
              <p className="text-sm text-[#9ca3af] leading-relaxed">{offer.description}</p>
            </div>
          )}

          {/* Requirements */}
          {offer.requirements && (
            <div className="mb-6">
              <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest mb-2">
                Requirements
              </p>
              <p className="text-sm text-[#9ca3af] leading-relaxed">{offer.requirements}</p>
            </div>
          )}

          {/* Form embed */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest mb-3">
              Apply now
            </p>
            <div className="rounded-xl overflow-hidden border border-[#151c2e] bg-white">
              <iframe
                src={offer.application_url}
                className="w-full"
                style={{ height: 560 }}
                frameBorder={0}
                title="Application form"
              />
            </div>
          </div>

          {/* Speed-up note */}
          <div className="bg-gradient-to-r from-violet-500/[0.05] to-indigo-600/[0.05] border border-violet-500/20 rounded-xl p-4">
            <p className="text-sm text-[#6b7280] leading-relaxed mb-3">
              <span className="text-violet-300 font-semibold">Speed up your application</span> — include your ApexCard stats link so the offer owner can verify your performance instantly.
            </p>
            {profileUrl ? (
              <button
                onClick={copyLink}
                className={cn(
                  "inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg border transition-all duration-200",
                  copied
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border-violet-500/20 hover:border-violet-400/40"
                )}
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5" /> Copied!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Copy my ApexCard link</>
                )}
              </button>
            ) : (
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 hover:border-violet-400/40 transition-all duration-200"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Create your ApexCard
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────

export default function OfferBoard({
  offers,
  userUsername,
  userEligibility,
}: {
  offers: Offer[];
  userUsername: string | null;
  userEligibility: UserEligibility;
}) {
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);

  const byRole = Object.fromEntries(
    ROLE_ORDER.map((rt) => [rt, offers.filter((o) => o.role_type === rt)])
  ) as Record<OfferRoleType, Offer[]>;

  return (
    <div className="min-h-screen bg-[#04060c]">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0e0c20 0%, #090812 50%, #060610 100%)",
          }}
        />
        <div className="absolute top-[-60px] left-[10%] w-[400px] h-[400px] bg-violet-500/[0.05] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-[-40px] right-[10%] w-[400px] h-[400px] bg-indigo-600/[0.07] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 pt-6 pb-14">
          {/* Top nav */}
          <div className="flex items-center justify-between mb-12">
            <ApexCardLogo />
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2d4a60] hover:text-[#4a7fa0] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
            </Link>
          </div>

          {/* Headline */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
              Find your next role.
            </h1>
            <p className="text-base font-semibold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent mb-2">
              Verified by ApexCard.
            </p>
            <p className="text-sm text-[#2d4a60] max-w-sm mx-auto">
              Curated sales roles posted by verified ApexCard owners.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        {/* Filter pills (visual only) */}
        <div className="flex flex-wrap gap-2">
          {FILTER_PILLS.map((label) => (
            <button
              key={label}
              disabled
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3.5 py-2 rounded-full bg-[#07090f] border border-[#0f1523] text-[#2d3a4a] cursor-default"
            >
              {label}
              <ChevronDown className="w-3 h-3 opacity-40" />
            </button>
          ))}
        </div>

        {/* Role sections */}
        {ROLE_ORDER.map((roleType) => {
          const roleOffers = byRole[roleType];
          if (!roleOffers.length) return null;
          const c = SECTION_COLORS[roleType];
          return (
            <section key={roleType}>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className={`w-1 h-5 rounded-full bg-gradient-to-b ${c.bar}`}
                />
                <h2 className={cn("text-[13px] font-extrabold tracking-tight", c.accent)}>
                  {ROLE_LABELS[roleType]}
                </h2>
                <span className="text-[10px] font-semibold text-[#2d3a4a] bg-[#07090f] border border-[#0f1523] px-2 py-0.5 rounded-full">
                  {roleOffers.length} role{roleOffers.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {roleOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} eligibility={userEligibility} onApply={setActiveOffer} />
                ))}
              </div>
            </section>
          );
        })}

        {offers.length === 0 && (
          <div className="text-center py-24">
            <Briefcase className="w-10 h-10 text-[#0f1523] mx-auto mb-4" />
            <p className="text-sm font-semibold text-[#374151]">No offers available right now.</p>
            <p className="text-xs text-[#1e2840] mt-1">Check back soon — new roles are added regularly.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {activeOffer && (
        <ApplyModal
          offer={activeOffer}
          userUsername={userUsername}
          onClose={() => setActiveOffer(null)}
        />
      )}
    </div>
  );
}
