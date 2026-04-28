"use client";

import { useState, useTransition } from "react";
import { Zap, X, CheckCircle2, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createCheckoutSession } from "@/app/dashboard/upgrade/actions";

interface Plan {
  id:          "free" | "pro" | "elite";
  name:        string;
  price:       string;
  period:      string;
  description: string;
  features:    string[];
  priceId?:    string;
  highlight:   boolean;
}

const PLANS: Plan[] = [
  {
    id:          "free",
    name:        "Free",
    price:       "£0",
    period:      "/month",
    description: "Team CRM access only.",
    features:    ["CRM daily log", "Personal stats", "Team leaderboard"],
    highlight:   false,
  },
  {
    id:          "pro",
    name:        "Pro",
    price:       "£5",
    period:      "/month",
    description: "Full access to ApexCard.",
    features:    [
      "Everything in Free",
      "Full CRM & history",
      "Verified stats card",
      "Offer board access",
      "Call analysis",
    ],
    priceId:     process.env.NEXT_PUBLIC_STRIPE_TEAM_PRO_PRICE_ID,
    highlight:   true,
  },
  {
    id:          "elite",
    name:        "Elite",
    price:       "£12",
    period:      "/month",
    description: "Maximum performance.",
    features:    [
      "Everything in Pro",
      "AI coaching dashboard",
      "Advanced analytics",
      "Priority support",
    ],
    priceId:     process.env.NEXT_PUBLIC_STRIPE_TEAM_ELITE_PRICE_ID,
    highlight:   false,
  },
];

function PricingModal({ teamName, onClose }: { teamName: string; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  function handleUpgrade(plan: Plan) {
    if (!plan.priceId) return;
    setPendingPlan(plan.id);
    startTransition(async () => {
      const url = await createCheckoutSession(plan.priceId!, plan.id === "pro" ? "pro" : "pro");
      if (url) window.location.href = url;
      setPendingPlan(null);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#0f1117] border border-[#1e2130] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1e2130]">
          <div>
            <h2 className="text-lg font-extrabold text-[#f0f2f8] tracking-tight">Upgrade Your Access</h2>
            <p className="text-sm text-[#4b5563] mt-0.5">Unlock full ApexCard features beyond {teamName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#374151] hover:text-[#9ca3af] border border-[#1e2130] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plans */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-xl border p-5 flex flex-col",
                  plan.highlight
                    ? "border-indigo-500/50 bg-indigo-500/5 shadow-lg shadow-indigo-500/10"
                    : "border-[#1e2130] bg-[#080a0e]"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5" /> Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <p className="font-bold text-[#f0f2f8] mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-2xl font-extrabold text-[#f0f2f8]">{plan.price}</span>
                    <span className="text-xs text-[#6b7280] mb-0.5">{plan.period}</span>
                  </div>
                  <p className="text-xs text-[#6b7280]">{plan.description}</p>
                </div>

                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#6b7280]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.id === "free" ? (
                  <div className="w-full py-2.5 rounded-xl text-xs font-bold text-[#374151] bg-white/[0.02] border border-[#1e2130] text-center">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={pending}
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50",
                      plan.highlight
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-white/[0.04] hover:bg-white/[0.08] text-[#9ca3af] border border-[#1e2130]"
                    )}
                  >
                    {pending && pendingPlan === plan.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Zap className="w-3.5 h-3.5" />
                    }
                    Upgrade with Stripe
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[#374151] mt-5">
            Billed monthly · Cancel anytime · Secure payment via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TeamMemberBanner({ teamName }: { teamName: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-[#0d0f17] border-b border-indigo-500/20 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
            <Zap className="w-3 h-3 text-indigo-400" />
          </div>
          <p className="text-sm text-[#9ca3af] font-medium truncate">
            <span className="text-indigo-300 font-semibold">{teamName}</span> Account
            <span className="hidden sm:inline text-[#6b7280]"> — Upgrade for Full Access</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="shrink-0 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-colors"
        >
          Upgrade
        </button>
      </div>

      {showModal && (
        <PricingModal teamName={teamName} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
