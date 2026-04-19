import { cn } from "@/lib/utils";

interface LogRow {
  date: string;
  calls: number;
  shows: number;
  offersMade: number;
  offersTaken: number;
  cash: number;
  commission: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function RecentLogs({ logs }: { logs: LogRow[] }) {
  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
      <div className="h-[2px] bg-violet-500 shadow-[0_2px_14px_2px_rgba(139,92,246,0.28)]" />
      <div className="px-5 py-4 border-b border-[#1e2130] flex items-center justify-between">
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Recent Call Logs</p>
        <span className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">View all</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e2130]">
              {["Date", "Calls", "Shows", "Offers Made", "Closed", "Cash", "Commission"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => {
              const closeRate = log.offersMade > 0 ? Math.round((log.offersTaken / log.offersMade) * 100) : 0;
              return (
                <tr key={i} className="border-b border-[#1e2130]/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-[#f0f2f8] font-medium whitespace-nowrap">{log.date}</td>
                  <td className="px-5 py-3.5 text-[#f0f2f8] tabular-nums">{log.calls}</td>
                  <td className="px-5 py-3.5 tabular-nums">
                    <span className={cn("font-medium", log.shows / log.calls >= 0.7 ? "text-emerald-400" : "text-amber-400")}>
                      {log.shows}
                    </span>
                    <span className="text-[#6b7280] text-xs ml-1">({Math.round((log.shows / log.calls) * 100)}%)</span>
                  </td>
                  <td className="px-5 py-3.5 text-[#f0f2f8] tabular-nums">{log.offersMade}</td>
                  <td className="px-5 py-3.5 tabular-nums">
                    <span className={cn("font-medium", closeRate >= 30 ? "text-emerald-400" : closeRate >= 20 ? "text-amber-400" : "text-rose-400")}>
                      {log.offersTaken}
                    </span>
                    <span className="text-[#6b7280] text-xs ml-1">({closeRate}%)</span>
                  </td>
                  <td className="px-5 py-3.5 text-emerald-400 font-semibold tabular-nums">{fmt(log.cash)}</td>
                  <td className="px-5 py-3.5 text-violet-400 font-semibold tabular-nums">{fmt(log.commission)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
