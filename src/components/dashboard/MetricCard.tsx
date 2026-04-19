import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  subvalue?: string;
  change?: number; // percent change vs last period
  icon: LucideIcon;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "violet" | "cyan";
}

const accents = {
  indigo:  { bg: "bg-indigo-500/10",  text: "text-indigo-400",  border: "border-indigo-500/20",  line: "bg-indigo-500  shadow-[0_2px_14px_2px_rgba(99,102,241,0.28)]"  },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", line: "bg-emerald-500 shadow-[0_2px_14px_2px_rgba(16,185,129,0.22)]" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   line: "bg-amber-500   shadow-[0_2px_14px_2px_rgba(245,158,11,0.22)]"  },
  rose:    { bg: "bg-rose-500/10",    text: "text-rose-400",    border: "border-rose-500/20",    line: "bg-rose-500    shadow-[0_2px_14px_2px_rgba(244,63,94,0.22)]"   },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/20",  line: "bg-violet-500  shadow-[0_2px_14px_2px_rgba(139,92,246,0.28)]"  },
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/20",    line: "bg-cyan-500    shadow-[0_2px_14px_2px_rgba(6,182,212,0.22)]"   },
};

export default function MetricCard({
  label,
  value,
  subvalue,
  change,
  icon: Icon,
  accent = "indigo",
}: MetricCardProps) {
  const colors = accents[accent];

  const TrendIcon =
    change === undefined || change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;
  const trendColor =
    change === undefined || change === 0
      ? "text-[#6b7280]"
      : change > 0
      ? "text-emerald-400"
      : "text-rose-400";

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden hover:border-[#2a2f45] hover:shadow-lg hover:shadow-black/30 transition-all duration-200 group">
      <div className={cn("h-[2px]", colors.line)} />
      <div className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center border", colors.bg, colors.border)}>
          <Icon className={cn("w-4 h-4", colors.text)} />
        </div>
        {change !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-semibold", trendColor)}>
            <TrendIcon className="w-3 h-3" />
            {change > 0 ? "+" : ""}{change}%
          </div>
        )}
      </div>

      <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <p className="text-3xl font-extrabold text-[#f0f2f8] tracking-tight leading-none">
        {value}
      </p>
      {subvalue && (
        <p className="text-xs text-[#6b7280] mt-1.5">{subvalue}</p>
      )}
      </div>
    </div>
  );
}
