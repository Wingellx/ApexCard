import { getBodyMetrics } from "@/lib/io-queries";
import BodyMetricsForm from "@/app/dashboard/io/body/BodyMetricsForm";

function LineChart({ data, color = "#8b5cf6", label }: {
  data: { date: string; value: number }[];
  color?: string;
  label: string;
}) {
  if (data.length < 2) return (
    <div className="h-24 flex items-center justify-center text-xs text-[#374151]">
      Log at least 2 entries to see a chart
    </div>
  );

  const vals = data.map(d => d.value);
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const range = Math.max(max - min, 0.1);
  const W = 280, H = 70, pad = 4;

  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.value - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  const latest = vals[vals.length - 1];
  const prev   = vals[vals.length - 2];
  const diff   = latest - prev;
  const diffStr = diff === 0 ? "same" : `${diff > 0 ? "+" : ""}${diff.toFixed(1)}`;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-extrabold tabular-nums" style={{ color }}>{latest.toFixed(1)}</span>
          <span className={`text-[10px] font-semibold ${diff < 0 ? "text-emerald-400" : diff > 0 ? "text-rose-400" : "text-[#6b7280]"}`}>
            {diffStr}
          </span>
        </div>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        {data.map((d, i) => {
          const x = pad + (i / (data.length - 1)) * (W - pad * 2);
          const y = H - pad - ((d.value - min) / range) * (H - pad * 2);
          return <circle key={i} cx={x} cy={y} r="3" fill={color} opacity={i === data.length - 1 ? 1 : 0.4} />;
        })}
      </svg>
    </div>
  );
}

const PR_COLORS = ["#8b5cf6", "#34d399", "#fbbf24"];

export default async function BodySection({ userId }: { userId: string }) {
  const metrics = await getBodyMetrics(userId, 30);
  const chronological = [...metrics].reverse();

  const weightSeries = chronological
    .filter(m => m.weight_lbs != null)
    .map(m => ({ date: m.log_date, value: m.weight_lbs as number }));

  const latest  = metrics[0];
  const prNames = [latest?.pr1_name, latest?.pr2_name, latest?.pr3_name].filter(Boolean) as string[];

  const prSeries = ([1, 2, 3] as const).map(n => {
    const nameKey = `pr${n}_name` as "pr1_name" | "pr2_name" | "pr3_name";
    const valKey  = `pr${n}_value` as "pr1_value" | "pr2_value" | "pr3_value";
    const name = latest?.[nameKey];
    if (!name) return null;
    const data = chronological
      .filter(m => m[nameKey] === name && m[valKey] != null)
      .map(m => ({ date: m.log_date, value: m[valKey] as number }));
    return { name, data };
  }).filter(Boolean) as { name: string; data: { date: string; value: number }[] }[];

  return (
    <div className="space-y-6 pt-10 border-t border-[#1e2130]">
      <div>
        <h2 className="text-lg font-extrabold text-[#f0f2f8] tracking-tight">Body Metrics</h2>
        <p className="text-sm text-[#6b7280] mt-1">Optional — track weight and up to 3 custom PRs over time.</p>
      </div>

      {metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {weightSeries.length >= 2 && (
            <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-5">
              <LineChart data={weightSeries} color="#8b5cf6" label="Weight (lbs)" />
            </div>
          )}
          {prSeries.map((pr, i) => pr.data.length >= 2 && (
            <div key={pr.name} className="bg-[#111318] border border-[#1e2130] rounded-xl p-5">
              <LineChart data={pr.data} color={PR_COLORS[i]} label={`${pr.name} (lbs)`} />
            </div>
          ))}
        </div>
      )}

      <BodyMetricsForm prNames={prNames} latest={latest ?? null} />

      {metrics.length > 0 && (
        <div className="bg-[#111318] border border-[#1e2130] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1e2130] bg-[#0d0f15]">
            <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest">History</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1e2130]">
                  <th className="text-left text-[#6b7280] px-5 py-2.5 font-semibold">Date</th>
                  <th className="text-right text-[#6b7280] px-4 py-2.5 font-semibold">Weight</th>
                  {prNames.map(n => <th key={n} className="text-right text-[#6b7280] px-4 py-2.5 font-semibold">{n}</th>)}
                </tr>
              </thead>
              <tbody>
                {metrics.slice(0, 10).map(m => (
                  <tr key={m.id} className="border-b border-[#1e2130] last:border-0">
                    <td className="px-5 py-3 text-[#9ca3af]">{m.log_date}</td>
                    <td className="px-4 py-3 text-right text-[#f0f2f8] tabular-nums font-medium">
                      {m.weight_lbs != null ? `${m.weight_lbs} lbs` : "—"}
                    </td>
                    {prNames.map((n, idx) => {
                      const val = idx === 0 ? m.pr1_value : idx === 1 ? m.pr2_value : m.pr3_value;
                      return <td key={n} className="px-4 py-3 text-right tabular-nums font-medium text-[#f0f2f8]">{val != null ? `${val} lbs` : "—"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
