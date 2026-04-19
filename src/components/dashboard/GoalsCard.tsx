import { cn } from "@/lib/utils";

interface GoalRow {
  label: string;
  actual: number;
  target: number;
  format: "number" | "percent" | "currency";
}

function fmt(value: number, format: GoalRow["format"]): string {
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  }
  if (format === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString();
}

function GoalBar({ actual, target, format }: Pick<GoalRow, "actual" | "target" | "format">) {
  const pct = Math.min((actual / target) * 100, 100);
  const over = actual >= target;

  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            over ? "bg-emerald-400" : pct >= 70 ? "bg-indigo-400" : pct >= 40 ? "bg-amber-400" : "bg-rose-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-xs font-semibold tabular-nums w-10 text-right shrink-0", over ? "text-emerald-400" : "text-[#6b7280]")}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

interface GoalsCardProps {
  goals: GoalRow[];
  period?: string;
}

export default function GoalsCard({ goals, period = "This Month" }: GoalsCardProps) {
  const totalPct = Math.round(goals.reduce((sum, g) => sum + Math.min((g.actual / g.target) * 100, 100), 0) / goals.length);

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden h-full">
      <div className="h-[2px] bg-indigo-500 shadow-[0_2px_14px_2px_rgba(99,102,241,0.28)]" />
      <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-0.5">Goals vs Actuals</p>
          <p className="text-xs text-[#6b7280]">{period}</p>
        </div>
        <div className="text-right">
          <p className={cn("text-2xl font-extrabold tracking-tight", totalPct >= 100 ? "text-emerald-400" : totalPct >= 70 ? "text-indigo-400" : "text-amber-400")}>
            {totalPct}%
          </p>
          <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Overall</p>
        </div>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const pct = Math.min((goal.actual / goal.target) * 100, 100);
          const over = goal.actual >= goal.target;
          return (
            <div key={goal.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#f0f2f8]">{goal.label}</span>
                <span className="text-xs tabular-nums">
                  <span className={cn("font-semibold", over ? "text-emerald-400" : "text-[#f0f2f8]")}>
                    {fmt(goal.actual, goal.format)}
                  </span>
                  <span className="text-[#6b7280]"> / {fmt(goal.target, goal.format)}</span>
                </span>
              </div>
              <GoalBar actual={goal.actual} target={goal.target} format={goal.format} />
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
