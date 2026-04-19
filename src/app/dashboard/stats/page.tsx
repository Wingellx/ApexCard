import { Award, ExternalLink, ShieldCheck, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllCallLogs, getProfileFull } from "@/lib/queries";
import CopyLinkButton from "@/components/dashboard/CopyLinkButton";
import VerificationForm from "@/components/dashboard/VerificationForm";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => n.toLocaleString();

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[#1e2130] last:border-0">
      <span className="text-sm text-[#6b7280]">{label}</span>
      <div className="text-right">
        <span className="text-sm font-bold text-[#f0f2f8] tabular-nums">{value}</span>
        {sub && <span className="text-xs text-[#6b7280] ml-2">{sub}</span>}
      </div>
    </div>
  );
}

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [logs, profile] = await Promise.all([
    user ? getAllCallLogs(user.id) : Promise.resolve([]),
    user ? getProfileFull(user.id) : Promise.resolve(null),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = profile?.username
    ? `${appUrl}/card/${profile.username}`
    : `${appUrl}/stats/${user?.id}`;

  // Fetch verification status (admin client — avoids RLS on verify_token columns)
  const admin = createAdminClient();
  const { data: verifyReq } = user
    ? await admin
        .from("verification_requests")
        .select("manager_name, manager_company, manager_email, status, created_at, verified_at")
        .eq("user_id", user.id)
        .in("status", ["pending", "verified"])
        .maybeSingle()
    : { data: null };

  const verificationStatus = (verifyReq?.status ?? "none") as "none" | "pending" | "verified" | "rejected";

  if (logs.length === 0) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Lifetime Stats</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">Log some calls first to see your stats.</p>
          </div>
        </div>
      </div>
    );
  }

  const totals = logs.reduce(
    (a, r) => ({
      calls:       a.calls       + (r.calls_taken       ?? 0),
      shows:       a.shows       + (r.shows             ?? 0),
      offersMade:  a.offersMade  + (r.offers_made       ?? 0),
      offersTaken: a.offersTaken + (r.offers_taken      ?? 0),
      cash:        a.cash        + Number(r.cash_collected    ?? 0),
      commission:  a.commission  + Number(r.commission_earned ?? 0),
    }),
    { calls: 0, shows: 0, offersMade: 0, offersTaken: 0, cash: 0, commission: 0 }
  );

  const showRate     = totals.calls        > 0 ? (totals.shows       / totals.calls)       * 100 : 0;
  const closeRate    = totals.shows        > 0 ? (totals.offersTaken / totals.shows)       * 100 : 0;
  const cashPerClose = totals.offersTaken  > 0 ?  totals.cash        / totals.offersTaken        : 0;
  const bestDay      = Math.max(...logs.map((r) => Number(r.cash_collected ?? 0)));
  const daysLogged   = logs.length;

  return (
    <div className="px-8 py-8 max-w-[900px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Lifetime Stats</h1>
              {verificationStatus === "verified" && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
            <p className="text-sm text-[#6b7280] mt-0.5">Your all-time performance across {daysLogged} logged days.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/stats"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] hover:text-[#f0f2f8] border border-[#1e2130] hover:border-[#2a2f45] px-3 py-2 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Stats
          </a>
          <a
            href={publicUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#f0f2f8] border border-[#1e2130] hover:border-[#2a2f45] px-3 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Preview card
          </a>
          <CopyLinkButton url={publicUrl} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Revenue */}
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
          <div className="h-[2px] bg-emerald-500 shadow-[0_2px_14px_2px_rgba(16,185,129,0.22)]" />
          <div className="p-5">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-4">Revenue</p>
          <StatRow label="Lifetime Cash Collected"  value={fmt(totals.cash)} />
          <StatRow label="Lifetime Commission"       value={fmt(totals.commission)} />
          <StatRow label="Average Cash Per Close"    value={fmt(cashPerClose)} />
          <StatRow label="Best Single Day"           value={fmt(bestDay)} />
          </div>
        </div>

        {/* Activity */}
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
          <div className="h-[2px] bg-violet-500 shadow-[0_2px_14px_2px_rgba(139,92,246,0.28)]" />
          <div className="p-5">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-4">Activity</p>
          <StatRow label="Lifetime Calls Taken"  value={fmtNum(totals.calls)} />
          <StatRow label="Lifetime Offers Made"  value={fmtNum(totals.offersMade)} />
          <StatRow label="Lifetime Deals Closed" value={fmtNum(totals.offersTaken)} />
          <StatRow label="Total Days Logged"     value={fmtNum(daysLogged)} />
          </div>
        </div>

        {/* Rates */}
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden md:col-span-2">
          <div className="h-[2px] bg-cyan-500 shadow-[0_2px_14px_2px_rgba(6,182,212,0.22)]" />
          <div className="p-5">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-4">Conversion Rates</p>
          <div className="grid grid-cols-2 gap-0">
            <StatRow label="Average Show Rate"  value={`${showRate.toFixed(1)}%`}  sub={`${totals.shows} of ${totals.calls} calls`} />
            <StatRow label="Average Close Rate" value={`${closeRate.toFixed(1)}%`} sub={`${totals.offersTaken} of ${totals.shows} shows`} />
          </div>
          </div>
        </div>
      </div>

      {/* Share callout */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-5 py-4 flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-[#f0f2f8] mb-0.5">Share your stats card</p>
          <p className="text-xs text-[#6b7280]">Public link — clean stats card for job apps, offers, or flex.</p>
        </div>
        <CopyLinkButton url={publicUrl} label="Copy link" />
      </div>

      {/* Get Verified section */}
      <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <p className="text-sm font-bold text-[#f0f2f8]">Get Verified</p>
        </div>
        <p className="text-xs text-[#6b7280] mb-5 leading-relaxed">
          Have a manager verify your stats. We&apos;ll email them a branded summary and a one-click confirm button.
          A green verified badge will appear on your public stats card.
        </p>
        <VerificationForm status={verificationStatus} existing={verifyReq ?? null} />
      </div>
    </div>
  );
}
