import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle2, Zap, Crown } from "lucide-react";
import CheckoutButton from "./CheckoutButton";

const plans = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "Perfect for solo closers getting dialed in.",
    features: [
      "Full personal dashboard",
      "Unlimited call logs",
      "Goals & actuals tracking",
      "30-day history",
      "Public ApexCard profile",
      "Email support",
    ],
    highlighted: false,
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? "",
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "For serious performers tracking every dollar.",
    features: [
      "Everything in Starter",
      "Unlimited history",
      "Commission forecasting",
      "Team features",
      "CSV export",
      "Priority support",
    ],
    highlighted: true,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
  },
];

export default async function UpgradePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_plan, trial_ends_at")
    .eq("id", user.id)
    .single();

  const isActive = profile?.subscription_status === "active";
  if (isActive) redirect("/dashboard");

  const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const trialExpired = trialEndsAt ? trialEndsAt < new Date() : true;
  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-3xl w-full">

        {/* Header */}
        <div className="text-center mb-12">
          {trialExpired ? (
            <>
              <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                Trial expired
              </div>
              <h1 className="text-4xl font-extrabold text-[#f0f2f8] tracking-tight mb-3">
                Your free trial has ended
              </h1>
              <p className="text-[#6b7280] max-w-md mx-auto">
                Choose a plan to continue using ApexCard and keep your data.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                <Zap className="w-3 h-3" />
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in trial
              </div>
              <h1 className="text-4xl font-extrabold text-[#f0f2f8] tracking-tight mb-3">
                Upgrade your plan
              </h1>
              <p className="text-[#6b7280] max-w-md mx-auto">
                Lock in your performance data and unlock all features.
              </p>
            </>
          )}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "border-indigo-500 bg-indigo-500/5 shadow-xl shadow-indigo-500/10"
                  : "border-[#1e2130] bg-[#111318]"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <p className="font-bold text-[#f0f2f8] text-lg mb-1">{plan.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-[#f0f2f8]">{plan.price}</span>
                  <span className="text-[#6b7280] mb-1">{plan.period}</span>
                </div>
                <p className="text-sm text-[#6b7280]">{plan.description}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#6b7280]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <CheckoutButton
                planId={plan.id}
                priceId={plan.priceId}
                highlighted={plan.highlighted}
              />
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[#6b7280] mt-8">
          Billed monthly · Cancel anytime · Secure payment via Stripe
        </p>
      </div>
    </div>
  );
}
