import { ShieldCheck, CheckCircle2, Calendar } from "lucide-react";
import type { ClosedOffer } from "@/lib/offers-queries";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const ROLE_LABELS: Record<string, string> = {
  closing:   "Closing",
  dm_setter: "DM Setting",
  dialling:  "Dialling",
};

const STATUS_CONFIG = {
  interview: { label: "Interview", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20"        },
  accepted:  { label: "Accepted",  cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"  },
};

export default function PastOffersPanel({ offers }: { offers: ClosedOffer[] }) {
  if (offers.length === 0) {
    return (
      <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl py-20 text-center">
        <Calendar className="w-10 h-10 text-[#1e2130] mx-auto mb-4" />
        <p className="text-sm font-semibold text-[#374151]">No past offers yet</p>
        <p className="text-xs text-[#2d3147] mt-1">
          Offers you close will appear here with their serious candidates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {offers.map(offer => (
        <div key={offer.id} className="bg-[#0f1117] border border-[#1e2130] rounded-2xl overflow-hidden">
          {/* Offer header */}
          <div className="px-5 py-4 border-b border-[#1e2130] flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-bold text-[#4b5563] bg-white/[0.02] border border-[#1e2130] px-2 py-0.5 rounded-full">
                  {ROLE_LABELS[offer.role_type] ?? offer.role_type}
                </span>
                <span className="text-[10px] font-bold text-[#374151] bg-white/[0.02] border border-[#1e2130] px-2 py-0.5 rounded-full">
                  {offer.niche}
                </span>
              </div>
              <p className="text-sm font-extrabold text-[#f0f2f8]">{offer.title}</p>
              <p className="text-xs font-semibold text-cyan-400/70 mt-0.5">{offer.company_name}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest">Closed</p>
              <p className="text-xs text-[#4b5563] mt-0.5">
                {new Date(offer.fulfilled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Applicants */}
          {offer.applicants.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-xs text-[#374151]">No candidates reached interview stage.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1e2130]">
              {offer.applicants.map(rep => {
                const cfg = STATUS_CONFIG[rep.status];
                return (
                  <div key={rep.user_id} className="px-5 py-4">
                    {/* Rep identity */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-[#f0f2f8]">{rep.rep_name}</p>
                          {rep.rep_is_verified && rep.rep_verification_active && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          )}
                        </div>
                        {rep.rep_username ? (
                          <a
                            href={`/card/${rep.rep_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#4b5563] hover:text-indigo-400 transition-colors"
                          >
                            @{rep.rep_username}
                          </a>
                        ) : (
                          <p className="text-[11px] text-[#374151]">{rep.rep_email}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#080a0e] border border-[#1e2130] rounded-xl px-3 py-2.5 text-center">
                        <p className="text-xs font-extrabold text-emerald-400 tabular-nums">{fmt(rep.rep_lifetime_cash)}</p>
                        <p className="text-[10px] text-[#374151] mt-0.5">Cash Collected</p>
                      </div>
                      <div className="bg-[#080a0e] border border-[#1e2130] rounded-xl px-3 py-2.5 text-center">
                        <p className="text-xs font-extrabold text-indigo-400 tabular-nums">{rep.rep_close_rate.toFixed(1)}%</p>
                        <p className="text-[10px] text-[#374151] mt-0.5">Close Rate</p>
                      </div>
                      <div className="bg-[#080a0e] border border-[#1e2130] rounded-xl px-3 py-2.5 text-center">
                        <p className="text-xs font-extrabold text-[#9ca3af] tabular-nums">{rep.rep_days_logged}</p>
                        <p className="text-[10px] text-[#374151] mt-0.5">Days Logged</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary footer */}
          {offer.applicants.length > 0 && (
            <div className="px-5 py-3 bg-white/[0.01] border-t border-[#1e2130] flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#374151]" />
              <p className="text-[11px] text-[#374151]">
                {offer.applicants.filter(a => a.status === "accepted").length} accepted ·{" "}
                {offer.applicants.filter(a => a.status === "interview").length} interviewed
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
