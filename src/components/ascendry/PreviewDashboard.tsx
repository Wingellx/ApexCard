"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// ─── Types & Data ─────────────────────────────────────────────────────────────

type Period = "week" | "month" | "all";

interface RepMetrics {
  leads: number;
  callsBooked: number;
  callsTaken: number;
  showRate: number;
  closeRate: number;
  cashCollected: number;
  noShows: number;
  followUps: number;
}

const DATA: Record<Period, { david: RepMetrics; tyler: RepMetrics }> = {
  week: {
    david: { leads: 12, callsBooked: 8, callsTaken: 6, showRate: 75, closeRate: 33, cashCollected: 4200, noShows: 2, followUps: 4 },
    tyler: { leads: 15, callsBooked: 10, callsTaken: 8, showRate: 80, closeRate: 38, cashCollected: 5800, noShows: 2, followUps: 5 },
  },
  month: {
    david: { leads: 48, callsBooked: 32, callsTaken: 26, showRate: 81, closeRate: 35, cashCollected: 18600, noShows: 6, followUps: 14 },
    tyler: { leads: 55, callsBooked: 40, callsTaken: 33, showRate: 83, closeRate: 39, cashCollected: 24200, noShows: 7, followUps: 18 },
  },
  all: {
    david: { leads: 186, callsBooked: 124, callsTaken: 98, showRate: 79, closeRate: 34, cashCollected: 68400, noShows: 26, followUps: 22 },
    tyler: { leads: 204, callsBooked: 148, callsTaken: 121, showRate: 82, closeRate: 37, cashCollected: 89600, noShows: 27, followUps: 31 },
  },
};

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, trigger: number, duration = 850) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(0);
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setValue(target);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, trigger, duration]);

  return value;
}

// ─── AnimatedValue ────────────────────────────────────────────────────────────

function AnimatedValue({
  value,
  prefix = "",
  suffix = "",
  trigger,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  trigger: number;
}) {
  const animated = useCountUp(value, trigger);
  return (
    <>{prefix}{animated.toLocaleString("en-GB")}{suffix}</>
  );
}

// ─── Metric Tile ──────────────────────────────────────────────────────────────

interface TileConfig {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  highlight?: "revenue" | "warning" | "muted";
}

function MetricTile({ label, value, prefix, suffix, highlight, trigger, repColor }: TileConfig & { trigger: number; repColor: string }) {
  const animated = useCountUp(value, trigger);

  const numberColor =
    highlight === "revenue"
      ? "text-emerald-400"
      : highlight === "warning"
      ? "text-amber-400"
      : highlight === "muted"
      ? "text-zinc-400"
      : "text-white";

  return (
    <div
      className="rounded-xl flex flex-col justify-between p-4 border border-[#1c1d2a] bg-[#0d0e18]"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
    >
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest leading-none mb-2">
        {label}
      </p>
      <p className={cn("text-3xl font-bold leading-none tabular-nums", numberColor)}>
        {prefix}{animated.toLocaleString("en-GB")}{suffix}
      </p>
    </div>
  );
}

// ─── Rep Card ─────────────────────────────────────────────────────────────────

interface RepCardProps {
  name: string;
  metrics: RepMetrics;
  color: string;
  colorMuted: string;
  colorBg: string;
  colorBorder: string;
  trigger: number;
}

function RepCard({ name, metrics, color, colorMuted, colorBg, colorBorder, trigger }: RepCardProps) {
  const cashAnimated = useCountUp(metrics.cashCollected, trigger);

  const tiles: TileConfig[] = [
    { label: "Leads Assigned",    value: metrics.leads,          highlight: undefined    },
    { label: "Calls Booked",      value: metrics.callsBooked,    highlight: undefined    },
    { label: "Calls Taken",       value: metrics.callsTaken,     highlight: undefined    },
    { label: "Show Rate",         value: metrics.showRate,       suffix: "%"             },
    { label: "Close Rate",        value: metrics.closeRate,      suffix: "%"             },
    { label: "Cash Collected",    value: metrics.cashCollected,  prefix: "£", highlight: "revenue" },
    { label: "No Shows",          value: metrics.noShows,        highlight: "warning"    },
    { label: "Follow Ups",        value: metrics.followUps,      highlight: "muted"      },
  ];

  return (
    <div
      className="rounded-2xl border flex flex-col min-h-0 overflow-hidden"
      style={{ borderColor: colorBorder, background: "linear-gradient(160deg, #0d0e18 0%, #080910 100%)" }}
    >
      {/* Rep header */}
      <div
        className="px-5 py-4 shrink-0 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${colorBorder}`, background: colorBg }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: color, boxShadow: `0 4px 14px ${color}50` }}
          >
            {name[0]}
          </div>
          <div>
            <p className="text-base font-bold text-white">{name}</p>
            <p className="text-xs font-medium" style={{ color: colorMuted }}>Sales Rep</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-0.5">Cash Collected</p>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">
            £{cashAnimated.toLocaleString("en-GB")}
          </p>
        </div>
      </div>

      {/* Metric grid */}
      <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-3 p-4 min-h-0">
        {tiles.filter(t => t.label !== "Cash Collected").map((tile) => (
          <MetricTile key={tile.label} {...tile} trigger={trigger} repColor={color} />
        ))}
      </div>
    </div>
  );
}

// ─── Team Totals Bar ──────────────────────────────────────────────────────────

function TeamTotals({ team, trigger }: { team: RepMetrics; trigger: number }) {
  const stats = [
    { label: "Leads",      value: team.leads },
    { label: "Booked",     value: team.callsBooked },
    { label: "Taken",      value: team.callsTaken },
    { label: "Show Rate",  value: team.showRate,       suffix: "%" },
    { label: "Close Rate", value: team.closeRate,       suffix: "%" },
    { label: "Cash",       value: team.cashCollected,   prefix: "£", green: true },
    { label: "No Shows",   value: team.noShows,         amber: true },
    { label: "Follow Ups", value: team.followUps },
  ] as const;

  return (
    <div className="shrink-0 px-6 py-3 border-b border-[#14151f]" style={{ background: "#0b0c13" }}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-violet-400 uppercase tracking-[0.15em]">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
          Team Totals
        </span>
      </div>
      <div className="grid grid-cols-8 divide-x divide-[#1a1b26]">
        {stats.map((s) => (
          <div key={s.label} className="text-center px-3 first:pl-0 last:pr-0">
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">{s.label}</p>
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                "green" in s && s.green ? "text-emerald-400" : "amber" in s && s.amber ? "text-amber-400" : "text-white"
              )}
            >
              <AnimatedValue
                value={s.value}
                prefix={"prefix" in s ? s.prefix : undefined}
                suffix={"suffix" in s ? s.suffix : undefined}
                trigger={trigger}
              />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const PERIODS: { key: Period; label: string }[] = [
  { key: "week",  label: "This Week"  },
  { key: "month", label: "This Month" },
  { key: "all",   label: "All Time"   },
];

const REP_CONFIGS = {
  david: {
    color:       "#7c3aed",
    colorMuted:  "#a78bfa",
    colorBg:     "rgba(124, 58, 237, 0.06)",
    colorBorder: "rgba(124, 58, 237, 0.2)",
  },
  tyler: {
    color:       "#059669",
    colorMuted:  "#34d399",
    colorBg:     "rgba(5, 150, 105, 0.06)",
    colorBorder: "rgba(5, 150, 105, 0.2)",
  },
};

export default function PreviewDashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const [trigger, setTrigger] = useState(0);

  function changePeriod(p: Period) {
    setPeriod(p);
    setTrigger((t) => t + 1);
  }

  const { david, tyler } = DATA[period];

  const team: RepMetrics = {
    leads:         david.leads         + tyler.leads,
    callsBooked:   david.callsBooked   + tyler.callsBooked,
    callsTaken:    david.callsTaken    + tyler.callsTaken,
    showRate:      Math.round((david.showRate  + tyler.showRate)  / 2),
    closeRate:     Math.round((david.closeRate + tyler.closeRate) / 2),
    cashCollected: david.cashCollected + tyler.cashCollected,
    noShows:       david.noShows       + tyler.noShows,
    followUps:     david.followUps     + tyler.followUps,
  };

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{ background: "#08090f", fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* ── Header ── */}
      <header
        className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-[#14151f]"
        style={{ background: "#0a0b12" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "#7c3aed", boxShadow: "0 4px 14px rgba(124,58,237,0.45)" }}
          >
            A
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-white tracking-tight">Ascendry</span>
            <span className="text-xs text-zinc-600 font-medium">/ Sales Team</span>
          </div>
        </div>

        {/* Period selector */}
        <div
          className="flex items-center gap-1 rounded-lg p-1 border border-[#1a1b26]"
          style={{ background: "#0d0e18" }}
        >
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => changePeriod(p.key)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                period === p.key
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              style={
                period === p.key
                  ? { background: "#7c3aed", boxShadow: "0 2px 8px rgba(124,58,237,0.4)" }
                  : undefined
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-zinc-500">Live</span>
        </div>
      </header>

      {/* ── Team Totals ── */}
      <TeamTotals team={team} trigger={trigger} />

      {/* ── Rep Cards ── */}
      <div className="flex-1 grid grid-cols-2 gap-4 p-4 min-h-0">
        <RepCard
          name="David"
          metrics={david}
          trigger={trigger}
          {...REP_CONFIGS.david}
        />
        <RepCard
          name="Tyler"
          metrics={tyler}
          trigger={trigger}
          {...REP_CONFIGS.tyler}
        />
      </div>
    </div>
  );
}
