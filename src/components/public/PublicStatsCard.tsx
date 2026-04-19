import Link from "next/link";
import { PhoneCall, Target, Handshake, Wallet, Trophy, CalendarDays, ShieldCheck, Crown, ChevronLeft } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => n.toLocaleString();

interface Props {
  name: string;
  isVerified: boolean;
  verifiedByName: string | null;
  verifiedByCompany: string | null;
  totals: {
    cash: number;
    commission: number;
    calls: number;
    offersMade: number;
    offersTaken: number;
    shows: number;
  };
  showRate: number;
  closeRate: number;
  cashPerClose: number;
  bestDay: number;
  daysLogged: number;
  monthlyRank?: number | null;
}

function monthlyRankLabel(rank: number): string {
  if (rank === 1) return "#1 closer this month";
  if (rank <= 3) return `Top 3 closer this month`;
  return `Top 10 closer this month`;
}

export default function PublicStatsCard({
  name, isVerified, verifiedByName, verifiedByCompany,
  totals, showRate, closeRate, cashPerClose, bestDay, daysLogged,
  monthlyRank,
}: Props) {
  const statTiles = [
    { icon: PhoneCall,    label: "Calls",      value: fmtNum(totals.calls),       color: "text-indigo-400" },
    { icon: Handshake,    label: "Offers Made", value: fmtNum(totals.offersMade),  color: "text-amber-400"  },
    { icon: Target,       label: "Closed",      value: fmtNum(totals.offersTaken), color: "text-emerald-400"},
    { icon: Wallet,       label: "Commission",  value: fmt(totals.commission),     color: "text-violet-400" },
    { icon: Trophy,       label: "Best Day",    value: fmt(bestDay),               color: "text-amber-400"  },
    { icon: CalendarDays, label: "Days Logged", value: fmtNum(daysLogged),         color: "text-sky-400"    },
  ];

  return (
    <div className="min-h-screen bg-[#080a0e] flex flex-col items-center justify-start py-12 px-4">

      {/* Back + Brand row */}
      <div className="animate-in w-full max-w-[520px] flex items-center justify-between mb-10">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[#374151] hover:text-[#6b7280] transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="ApexCard" className="w-6 h-6" />
          <span className="text-[13px] font-semibold text-[#374151] tracking-tight">ApexCard</span>
        </div>
        <div className="w-[52px]" />
      </div>

      <div className="w-full max-w-[520px]">

        {/* Hero card */}
        <div
          className="animate-in bg-[#0f1117] rounded-3xl overflow-hidden mb-2.5 ring-1 ring-white/[0.06] shadow-2xl shadow-black/70"
          style={{ animationDelay: "100ms" }}
        >
          {/* Gradient accent bar */}
          <div className="h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400" />

          {/* Identity */}
          <div className="px-6 sm:px-7 pt-7 pb-5">
            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.25em] mb-3">
              Sales Performance
            </p>
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-[1.9rem] sm:text-[2.1rem] font-extrabold text-white tracking-tight leading-[1.1]">
                {name}
              </h1>
              {isVerified && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-full mt-1 whitespace-nowrap shrink-0">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
              {monthlyRank != null && (
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded-full mt-1 whitespace-nowrap shrink-0">
                  <Crown className="w-3 h-3" /> {monthlyRankLabel(monthlyRank)}
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#4b5563] mt-1.5 font-medium">
              {fmtNum(daysLogged)} days logged
            </p>
          </div>

          {/* Lifetime Cash — hero number */}
          <div className="px-6 sm:px-7 pb-7 border-b border-[#13161f]">
            <p className="text-[9px] font-bold text-[#374151] uppercase tracking-[0.2em] mb-1.5">
              Lifetime Cash Collected
            </p>
            <p className="text-[2.75rem] sm:text-[3.25rem] font-extrabold text-emerald-400 tabular-nums tracking-tight leading-none">
              {fmt(totals.cash)}
            </p>
          </div>

          {/* Conversion rates strip */}
          <div className="grid grid-cols-3">
            {[
              { label: "Show Rate",    value: `${showRate.toFixed(1)}%`  },
              { label: "Close Rate",   value: `${closeRate.toFixed(1)}%` },
              { label: "Cash / Close", value: fmt(cashPerClose)          },
            ].map(({ label, value }, i) => (
              <div
                key={label}
                className={`px-3 sm:px-5 py-4 sm:py-5 ${i < 2 ? "border-r border-[#13161f]" : ""}`}
              >
                <p className="text-[9px] font-bold text-[#374151] uppercase tracking-[0.15em] mb-1.5 truncate">{label}</p>
                <p className="text-[1.1rem] sm:text-[1.35rem] font-extrabold text-[#e2e8f0] tabular-nums leading-none">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stat tiles */}
        <div
          className="animate-in grid grid-cols-3 gap-2 mb-3"
          style={{ animationDelay: "220ms" }}
        >
          {statTiles.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-[#0f1117] ring-1 ring-white/[0.06] rounded-2xl px-3 sm:px-4 py-3.5">
              <p className="text-[9px] font-bold text-[#374151] uppercase tracking-[0.12em] mb-2 truncate">{label}</p>
              <p className={`text-[1rem] sm:text-[1.15rem] font-extrabold tabular-nums ${color} leading-none`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="animate-in flex items-center justify-between px-0.5"
          style={{ animationDelay: "340ms" }}
        >
          {isVerified && verifiedByName ? (
            <p className="text-[11px] text-emerald-500/50 flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3 h-3 shrink-0" />
              Verified by {verifiedByName}{verifiedByCompany ? ` · ${verifiedByCompany}` : ""}
            </p>
          ) : (
            <p className="text-[11px] text-[#1f2937] font-medium">Powered by ApexCard</p>
          )}
          <a
            href="/"
            className="text-[11px] text-[#374151] hover:text-indigo-400 transition-colors font-semibold"
          >
            Get your card →
          </a>
        </div>

      </div>
    </div>
  );
}
