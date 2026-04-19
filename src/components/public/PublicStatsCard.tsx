"use client";

import Link from "next/link";
import { ShieldCheck, Crown, ChevronLeft, Flame, Star } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  closer:  "Closer",
  sdr:     "SDR",
  ae:      "Account Executive",
  manager: "Sales Manager",
  setter:  "Appointment Setter",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => n.toLocaleString();

interface Props {
  name: string;
  role?: string | null;
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
  streak?: number;
  monthlyRank?: number | null;
}

function rankLabel(rank: number) {
  if (rank === 1) return "#1 Closer This Month";
  if (rank <= 3) return "Top 3 Closer This Month";
  return "Top 10 Closer This Month";
}

export default function PublicStatsCard({
  name, role, isVerified, verifiedByName, verifiedByCompany,
  totals, showRate, closeRate, cashPerClose, bestDay, daysLogged,
  streak = 0, monthlyRank,
}: Props) {
  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : null;

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-start py-10 sm:py-16 px-4">

      {/* Back + Brand row */}
      <div className="animate-in w-full max-w-[500px] flex items-center justify-between mb-8">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-0.5 text-[13px] font-medium text-[#2d3748] hover:text-[#6b7280] transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="ApexCard" className="w-5 h-5" />
          <span className="text-[12px] font-bold text-[#2d3748] tracking-[0.12em] uppercase">ApexCard</span>
        </div>
        <div className="w-[52px]" />
      </div>

      {/* ── Animated gradient border wrapper ─────────────────────── */}
      <div
        className="animate-in relative w-full max-w-[500px] rounded-[28px] overflow-hidden"
        style={{ animationDelay: "80ms", padding: "1px" }}
      >
        {/* Rotating conic gradient — creates the border */}
        <div
          className="absolute animate-border-spin pointer-events-none"
          style={{
            width: "150%",
            height: "150%",
            top: "-25%",
            left: "-25%",
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(139,92,246,0.7) 50deg, rgba(99,102,241,0.6) 80deg, rgba(14,165,233,0.35) 120deg, transparent 160deg, transparent 300deg, rgba(139,92,246,0.4) 340deg, transparent 360deg)",
          }}
        />

        {/* ── Card ────────────────────────────────────────────────── */}
        <div
          className="relative rounded-[27px] overflow-hidden"
          style={{ background: "#080910" }}
        >

          {/* Purple glow accent line */}
          <div
            className="h-[2px]"
            style={{
              background: "linear-gradient(90deg, rgba(109,40,217,0.6) 0%, rgba(139,92,246,1) 30%, rgba(99,102,241,0.9) 60%, rgba(109,40,217,0.6) 100%)",
              boxShadow: "0 2px 24px 4px rgba(139,92,246,0.45)",
            }}
          />

          {/* ── Header: ApexCard + Verified ─────────────────────── */}
          <div className="px-6 sm:px-8 pt-5 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="" className="w-4 h-4 opacity-60" />
              <span
                className="text-[9px] font-black uppercase tracking-[0.3em]"
                style={{ color: "rgba(139,92,246,0.5)" }}
              >
                ApexCard
              </span>
            </div>
            {isVerified && (
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full tracking-wide uppercase">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </div>
            )}
          </div>

          {/* ── Identity ────────────────────────────────────────── */}
          <div
            className="px-6 sm:px-8 pb-6"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            {monthlyRank != null && (
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full mb-3 tracking-wide uppercase">
                <Crown className="w-3 h-3" />
                {rankLabel(monthlyRank)}
              </div>
            )}
            <h1
              className="font-black text-white tracking-tight leading-[1.0]"
              style={{ fontSize: "clamp(2rem, 8vw, 2.8rem)", fontFamily: "var(--font-sora), system-ui, sans-serif" }}
            >
              {name}
            </h1>
            {roleLabel && (
              <p className="text-[13px] font-semibold mt-1.5" style={{ color: "rgba(107,114,128,0.9)" }}>
                {roleLabel}
              </p>
            )}
          </div>

          {/* ── Hero: Lifetime Cash ──────────────────────────────── */}
          <div
            className="px-6 sm:px-8 py-7"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            <p
              className="text-[9px] font-black uppercase tracking-[0.3em] mb-2"
              style={{ color: "rgba(16,185,129,0.5)" }}
            >
              Lifetime Cash Collected
            </p>
            <p
              className="font-black tabular-nums tracking-tight leading-none"
              style={{
                fontSize: "clamp(2.8rem, 12vw, 4.2rem)",
                color: "#10b981",
                textShadow: "0 0 40px rgba(16,185,129,0.25)",
                fontFamily: "var(--font-sora), system-ui, sans-serif",
              }}
            >
              {fmt(totals.cash)}
            </p>
            <p className="text-[12px] font-medium mt-2.5" style={{ color: "rgba(75,85,99,0.9)" }}>
              across{" "}
              <span className="text-[#6b7280] font-semibold">{fmtNum(totals.calls)}</span>{" "}
              calls taken
            </p>
          </div>

          {/* ── Conversion Rates Strip ───────────────────────────── */}
          <div
            className="grid grid-cols-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            {[
              { label: "Show Rate",    value: `${showRate.toFixed(1)}%`,    color: "#818cf8" },
              { label: "Close Rate",   value: `${closeRate.toFixed(1)}%`,   color: "#a78bfa" },
              { label: "Cash / Close", value: fmt(cashPerClose),            color: "#c4b5fd" },
            ].map(({ label, value, color }, i) => (
              <div
                key={label}
                className="px-3 sm:px-5 py-4 sm:py-5"
                style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.04)" : undefined }}
              >
                <p className="text-[8px] font-black uppercase tracking-[0.18em] mb-1.5" style={{ color: "rgba(75,85,99,0.8)" }}>
                  {label}
                </p>
                <p className="font-extrabold tabular-nums leading-none" style={{ fontSize: "1.2rem", color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Activity Grid ────────────────────────────────────── */}
          <div
            className="grid grid-cols-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            {[
              { label: "Calls",      value: fmtNum(totals.calls),       color: "#6366f1" },
              { label: "Offers",     value: fmtNum(totals.offersMade),  color: "#f59e0b" },
              { label: "Closed",     value: fmtNum(totals.offersTaken), color: "#10b981" },
              { label: "Commission", value: fmt(totals.commission),     color: "#8b5cf6" },
            ].map(({ label, value, color }, i) => (
              <div
                key={label}
                className="px-2 sm:px-4 py-4 sm:py-5"
                style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.04)" : undefined }}
              >
                <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(75,85,99,0.8)" }}>
                  {label}
                </p>
                <p className="text-[0.85rem] sm:text-[1rem] font-extrabold tabular-nums leading-none" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Best Day ─────────────────────────────────────────── */}
          <div
            className="px-6 sm:px-8 py-5 flex items-center justify-between"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              background: "rgba(245,158,11,0.03)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <Star className="w-4 h-4 text-amber-500/60 shrink-0" fill="currentColor" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.22em]" style={{ color: "rgba(180,120,30,0.6)" }}>
                  Best Single Day
                </p>
                <p className="text-[1.5rem] sm:text-[1.75rem] font-black tabular-nums leading-tight" style={{ color: "#f59e0b" }}>
                  {fmt(bestDay)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-[0.22em] mb-1" style={{ color: "rgba(75,85,99,0.6)" }}>
                Days Logged
              </p>
              <p className="text-[1.4rem] font-black tabular-nums" style={{ color: "#9ca3af" }}>
                {fmtNum(daysLogged)}
              </p>
            </div>
          </div>

          {/* ── Verified by Manager Panel ────────────────────────── */}
          {isVerified && verifiedByName && (
            <div
              className="px-6 sm:px-8 py-4 flex items-center gap-3"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: "rgba(16,185,129,0.04)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em]">
                  Stats Verified
                </p>
                <p className="text-[11px] font-medium" style={{ color: "rgba(107,114,128,0.8)" }}>
                  {verifiedByName}
                  {verifiedByCompany ? (
                    <span style={{ color: "rgba(75,85,99,0.7)" }}> · {verifiedByCompany}</span>
                  ) : null}
                </p>
              </div>
            </div>
          )}

          {/* ── Footer: Streak + CTA ─────────────────────────────── */}
          <div className="px-6 sm:px-8 py-5">
            <div className="flex items-center justify-between">
              {streak > 1 ? (
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500/70" />
                  <span className="text-[11px] font-bold" style={{ color: "rgba(107,114,128,0.7)" }}>
                    {streak}-day streak
                  </span>
                </div>
              ) : (
                <span className="text-[11px] font-medium" style={{ color: "rgba(55,65,81,0.8)" }}>
                  apexcard.co
                </span>
              )}
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.15em] transition-colors"
                style={{ color: "rgba(139,92,246,0.7)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(167,139,250,0.9)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(139,92,246,0.7)")}
              >
                Get your ApexCard →
              </a>
            </div>
          </div>

        </div>
        {/* ── End card ─────────────────────────────────────────────── */}
      </div>

    </div>
  );
}
