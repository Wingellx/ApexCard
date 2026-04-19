import { lastMonthBounds } from "@/lib/queries";

type Log = {
  date: string;
  calls_taken?: number | null;
  shows?: number | null;
  offers_taken?: number | null;
  cash_collected?: number | string | null;
  commission_earned?: number | string | null;
};

type Goals = {
  calls_target?:       number | null;
  cash_target?:        number | null;
  commission_target?:  number | null;
  close_rate_target?:  number | null;
} | null;

function aggregate(logs: Log[]) {
  return logs.reduce(
    (a, r) => ({
      calls:       a.calls       + (r.calls_taken  ?? 0),
      shows:       a.shows       + (r.shows         ?? 0),
      offersTaken: a.offersTaken + (r.offers_taken  ?? 0),
      cash:        a.cash        + Number(r.cash_collected    ?? 0),
      commission:  a.commission  + Number(r.commission_earned ?? 0),
    }),
    { calls: 0, shows: 0, offersTaken: 0, cash: 0, commission: 0 }
  );
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function ProgressBar({ value, target, format }: { value: number; target: number; format: "currency" | "number" | "percent" }) {
  if (!target) return null;
  const pct = Math.min((value / target) * 100, 100);
  const color = pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-amber-500" : "bg-indigo-500";
  const label = format === "currency" ? fmt(value) : format === "percent" ? `${value.toFixed(1)}%` : value.toLocaleString();
  const targetLabel = format === "currency" ? fmt(target) : format === "percent" ? `${target}%` : target.toLocaleString();
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[#9ca3af]">{label}</span>
        <span className="text-[#4b5563]">/ {targetLabel}</span>
      </div>
      <div className="h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

type Props = {
  thisMonthLogs: Log[];
  lastMonthLogs: Log[];
  goals: Goals;
  monthLabel: string;
};

export default function MonthlySummaryCard({ thisMonthLogs, lastMonthLogs, goals, monthLabel }: Props) {
  const tm = aggregate(thisMonthLogs);
  const lm = aggregate(lastMonthLogs);
  const { label: lastMonthLabel } = lastMonthBounds();
  const tmCR = tm.shows > 0 ? (tm.offersTaken / tm.shows) * 100 : 0;
  const lmCR = lm.shows > 0 ? (lm.offersTaken / lm.shows) * 100 : 0;

  function delta(cur: number, prev: number, format: "currency" | "number" | "percent" = "number") {
    const diff = cur - prev;
    if (Math.abs(diff) < 0.01) return null;
    const up = diff > 0;
    const label =
      format === "currency" ? fmt(Math.abs(diff)) :
      format === "percent"  ? `${Math.abs(diff).toFixed(1)}%` :
      String(Math.abs(Math.round(diff)));
    return (
      <span className={`text-xs font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}>
        {up ? "+" : "−"}{label} vs {lastMonthLabel}
      </span>
    );
  }

  const hasGoals = !!(goals?.cash_target || goals?.calls_target || goals?.commission_target);

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
      <div className="h-[2px] bg-emerald-500 shadow-[0_2px_14px_2px_rgba(16,185,129,0.22)]" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Monthly Summary</p>
          <span className="text-[11px] text-[#4b5563]">{monthLabel}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <p className="text-xs text-[#6b7280] mb-0.5">Cash Collected</p>
            <p className="text-lg font-extrabold text-[#f0f2f8] tabular-nums">{fmt(tm.cash)}</p>
            {delta(tm.cash, lm.cash, "currency")}
          </div>
          <div>
            <p className="text-xs text-[#6b7280] mb-0.5">Calls Taken</p>
            <p className="text-lg font-extrabold text-[#f0f2f8] tabular-nums">{tm.calls.toLocaleString()}</p>
            {delta(tm.calls, lm.calls, "number")}
          </div>
          <div>
            <p className="text-xs text-[#6b7280] mb-0.5">Close Rate</p>
            <p className="text-lg font-extrabold text-[#f0f2f8] tabular-nums">{tmCR.toFixed(1)}%</p>
            {delta(tmCR, lmCR, "percent")}
          </div>
          <div>
            <p className="text-xs text-[#6b7280] mb-0.5">Commission</p>
            <p className="text-lg font-extrabold text-[#f0f2f8] tabular-nums">{fmt(tm.commission)}</p>
            {delta(tm.commission, lm.commission, "currency")}
          </div>
        </div>

        {hasGoals && (
          <>
            <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-3">Goal Progress</p>
            {goals?.cash_target        ? <ProgressBar value={tm.cash}        target={goals.cash_target}        format="currency" /> : null}
            {goals?.calls_target       ? <ProgressBar value={tm.calls}       target={goals.calls_target}       format="number"   /> : null}
            {goals?.commission_target  ? <ProgressBar value={tm.commission}  target={goals.commission_target}  format="currency" /> : null}
          </>
        )}
      </div>
    </div>
  );
}
