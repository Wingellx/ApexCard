import { notFound, redirect } from "next/navigation";
import { CheckCircle2, ShieldCheck, PhoneCall, DollarSign, Target, Handshake, Wallet, CalendarDays } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicLifetimeStats } from "@/lib/queries";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// ── Server action — manager confirms ─────────────────────────────
async function confirmVerification(token: string) {
  "use server";

  const admin = createAdminClient();

  const { data: req } = await admin
    .from("verification_requests")
    .select("id, user_id, manager_name, manager_company, status")
    .eq("verify_token", token)
    .maybeSingle();

  if (!req || req.status !== "pending") {
    redirect(`/verify/${token}?already=1`);
  }

  const now = new Date().toISOString();

  // Update verification request
  await admin
    .from("verification_requests")
    .update({ status: "verified", verified_at: now })
    .eq("id", req.id);

  // Update user's profile
  await admin
    .from("profiles")
    .update({
      is_verified:         true,
      verified_by_name:    req.manager_name,
      verified_by_company: req.manager_company,
      verified_at:         now,
    })
    .eq("id", req.user_id);

  redirect(`/verify/${token}?confirmed=1`);
}

// ── Page ─────────────────────────────────────────────────────────
export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ confirmed?: string; already?: string }>;
}) {
  const { token } = await params;
  const { confirmed, already } = await searchParams;

  const admin = createAdminClient();
  const { data: req } = await admin
    .from("verification_requests")
    .select("id, user_id, manager_name, manager_company, manager_email, status, verified_at, created_at")
    .eq("verify_token", token)
    .maybeSingle();

  if (!req) notFound();

  const stats = await getPublicLifetimeStats(req.user_id);
  if (!stats) notFound();

  const isConfirmed = confirmed === "1" || req.status === "verified";
  const isAlready   = already === "1";
  const isRejected  = req.status === "rejected";

  const confirmAction = confirmVerification.bind(null, token);

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex flex-col items-center justify-start py-16 px-6">

      {/* Brand */}
      <div className="animate-in flex items-center gap-2 mb-10">
        <img src="/logo.svg" alt="ApexCard" className="w-7 h-7" />
        <span className="text-sm font-bold text-[#6b7280]">ApexCard</span>
      </div>

      <div className="w-full max-w-xl">

        {/* ── Confirmed state ────────────────────────────────── */}
        {isConfirmed && (
          <div className="animate-in bg-[#111318] border border-emerald-500/30 rounded-2xl p-10 text-center" style={{ animationDelay: "120ms" }}>
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight mb-2">
              {isAlready ? "Already verified" : "Verified!"}
            </h1>
            <p className="text-[#6b7280] text-sm leading-relaxed mb-1">
              {isAlready
                ? `${stats.name}'s stats were already marked as verified.`
                : `You've verified ${stats.name}'s sales performance.`}
            </p>
            <p className="text-xs text-[#6b7280]">
              This will appear on their public ApexCard profile.
            </p>
          </div>
        )}

        {/* ── Rejected state ─────────────────────────────────── */}
        {!isConfirmed && isRejected && (
          <div className="animate-in bg-[#111318] border border-[#1e2130] rounded-2xl p-10 text-center" style={{ animationDelay: "120ms" }}>
            <h1 className="text-xl font-extrabold text-[#f0f2f8] mb-2">Request declined</h1>
            <p className="text-sm text-[#6b7280]">This verification request has already been declined.</p>
          </div>
        )}

        {/* ── Pending — confirm UI ───────────────────────────── */}
        {!isConfirmed && !isRejected && (
          <div className="animate-in" style={{ animationDelay: "120ms" }}>
            {/* Header */}
            <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-8 mb-4">
              <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-2">Manager Verification</p>
              <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight mb-1">
                Verify {stats.name}&apos;s performance
              </h1>
              <p className="text-sm text-[#6b7280]">
                {req.manager_name} · {req.manager_company}
              </p>

              {/* Key stats */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  { label: "Lifetime Cash",   value: fmt(stats.totals.cash),       color: "text-emerald-400" },
                  { label: "Commission",       value: fmt(stats.totals.commission), color: "text-violet-400"  },
                  { label: "Show Rate",        value: `${stats.showRate.toFixed(1)}%`,  color: "text-[#f0f2f8]" },
                  { label: "Close Rate",       value: `${stats.closeRate.toFixed(1)}%`, color: "text-[#f0f2f8]" },
                  { label: "Calls Taken",      value: stats.totals.calls.toLocaleString(), color: "text-[#f0f2f8]" },
                  { label: "Deals Closed",     value: stats.totals.offersTaken.toLocaleString(), color: "text-[#f0f2f8]" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#0d0f15] border border-[#1e2130] rounded-xl px-4 py-3">
                    <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-lg font-extrabold tabular-nums ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm form */}
            <div className="bg-[#111318] border border-indigo-500/20 rounded-2xl p-8">
              <div className="flex items-start gap-3 mb-6">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  By clicking <strong className="text-[#f0f2f8]">Confirm Verification</strong>, you confirm that you managed{" "}
                  <strong className="text-[#f0f2f8]">{stats.name}</strong> at{" "}
                  <strong className="text-[#f0f2f8]">{req.manager_company}</strong> and that their reported
                  stats are accurate to the best of your knowledge.
                </p>
              </div>

              <form action={confirmAction}>
                <button
                  type="submit"
                  className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-indigo-500/20"
                >
                  Confirm Verification
                </button>
              </form>

              <p className="text-center text-xs text-[#6b7280] mt-4">
                Changed your mind?{" "}
                <a
                  href={`/api/verify/decline/${token}`}
                  className="text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Decline this request
                </a>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
