import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { weekRangeLabel, thisWeekBounds, lastWeekBounds } from "@/lib/queries";

type Log = {
  date: string;
  calls_taken?: number | null;
  shows?: number | null;
  offers_taken?: number | null;
  cash_collected?: number | string | null;
  commission_earned?: number | string | null;
};

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

function closeRate(shows: number, offers: number) {
  return shows > 0 ? (offers / shows) * 100 : 0;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

type DeltaProps = { current: number; prev: number; format?: "number" | "currency" | "percent" };

function Delta({ current, prev, format = "number" }: DeltaProps) {
  const diff = current - prev;
  if (Math.abs(diff) < 0.01) return <Minus className="w-3.5 h-3.5 text-[#6b7280]" />;
  const up = diff > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const color = up ? "text-emerald-400" : "text-rose-400";
  const label =
    format === "currency" ? fmt(Math.abs(diff)) :
    format === "percent"  ? `${Math.abs(diff).toFixed(1)}%` :
    String(Math.abs(Math.round(diff)));
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

type StatRowProps = {
  label: string;
  current: number;
  prev: number;
  format?: "number" | "currency" | "percent";
};

function StatRow({ label, current, prev, format = "number" }: StatRowProps) {
  const display =
    format === "currency" ? fmt(current) :
    format === "percent"  ? `${current.toFixed(1)}%` :
    current.toLocaleString();
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1e2130] last:border-0">
      <span className="text-sm text-[#6b7280]">{label}</span>
      <div className="flex items-center gap-3">
        <Delta current={current} prev={prev} format={format} />
        <span className="text-sm font-bold text-[#f0f2f8] tabular-nums w-20 text-right">{display}</span>
      </div>
    </div>
  );
}

type Props = {
  thisWeekLogs: Log[];
  lastWeekLogs: Log[];
};

export default function WeeklySummary({ thisWeekLogs, lastWeekLogs }: Props) {
  const tw = aggregate(thisWeekLogs);
  const lw = aggregate(lastWeekLogs);
  const twCR = closeRate(tw.shows, tw.offersTaken);
  const lwCR = closeRate(lw.shows, lw.offersTaken);

  const { start } = thisWeekBounds();
  const { start: lwStart } = lastWeekBounds();

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
      <div className="h-[2px] bg-violet-500 shadow-[0_2px_14px_2px_rgba(139,92,246,0.28)]" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Weekly Summary</p>
          <span className="text-[11px] text-[#4b5563]">vs {weekRangeLabel(lwStart)}</span>
        </div>
        <p className="text-xs text-[#4b5563] mb-3">{weekRangeLabel(start)}</p>
        <StatRow label="Calls Taken"       current={tw.calls}       prev={lw.calls}       format="number"   />
        <StatRow label="Cash Collected"    current={tw.cash}        prev={lw.cash}        format="currency" />
        <StatRow label="Close Rate"        current={twCR}           prev={lwCR}           format="percent"  />
        <StatRow label="Commission Earned" current={tw.commission}  prev={lw.commission}  format="currency" />
      </div>
    </div>
  );
}
