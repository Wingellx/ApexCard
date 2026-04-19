"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface DayData {
  date: string;   // "Apr 1"
  cash: number;
}

interface Props { data: DayData[]; }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-bold text-emerald-400">
        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val)}
      </p>
    </div>
  );
}

export default function DailyCashChart({ data }: Props) {
  const hasData = data.some((d) => d.cash > 0);
  const max = Math.max(...data.map((d) => d.cash), 1);

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
      <div className="h-[2px] bg-emerald-500 shadow-[0_2px_14px_2px_rgba(16,185,129,0.22)]" />
      <div className="p-5">
      <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1">Daily Cash Collected</p>
      <p className="text-xs text-[#6b7280] mb-5">Current month</p>
      {!hasData ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-xs text-[#6b7280]">No data yet — log your first calls</p>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="cash" radius={[3, 3, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.cash >= max * 0.8 ? "#34d399" : entry.cash > 0 ? "#6366f1" : "#1e2130"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      </div>
    </div>
  );
}
