"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface DayData {
  date: string;
  closeRate: number;
}

interface Props {
  data: DayData[];
  avgCloseRate: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-bold text-indigo-400">{payload[0].value.toFixed(1)}%</p>
    </div>
  );
}

export default function CloseRateTrendChart({ data, avgCloseRate }: Props) {
  const hasData = data.length > 1;

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
      <div className="h-[2px] bg-indigo-500 shadow-[0_2px_14px_2px_rgba(99,102,241,0.28)]" />
      <div className="p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Close Rate Trend</p>
        {hasData && (
          <span className="text-xs text-[#6b7280]">
            Avg <span className="text-indigo-400 font-semibold">{avgCloseRate.toFixed(1)}%</span>
          </span>
        )}
      </div>
      <p className="text-xs text-[#6b7280] mb-5">Last 30 days</p>
      {!hasData ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-xs text-[#6b7280]">Need at least 2 days of data</p>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                width={36}
                tickFormatter={(v) => `${v}%`}
                domain={[0, "auto"]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#1e2130" }} />
              {avgCloseRate > 0 && (
                <ReferenceLine
                  y={avgCloseRate}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
              )}
              <Line
                type="monotone"
                dataKey="closeRate"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
                activeDot={{ fill: "#818cf8", r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      </div>
    </div>
  );
}
