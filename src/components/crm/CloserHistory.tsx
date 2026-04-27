"use client";

import { TrendingUp } from "lucide-react";
import type { CrmFieldDef, CrmCustomLog } from "@/lib/closer-crm-queries";

interface Props {
  fields: CrmFieldDef[];
  history: CrmCustomLog[];
}

function formatDate(iso: string): string {
  // Parse at noon local time to avoid date shifting from UTC conversion
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatValue(log: CrmCustomLog, field: CrmFieldDef): string {
  if (field.field_type === "boolean")  return log.value_boolean ? "Yes" : "No";
  if (field.field_type === "duration") return log.value_number != null ? `${log.value_number}m` : "—";
  if (field.field_type === "text")     return log.value_text?.trim() || "—";
  return log.value_number != null ? String(log.value_number) : "—";
}

export default function CloserHistory({ fields, history }: Props) {
  const activeFields = fields.filter(f => f.is_active);
  if (activeFields.length === 0 || history.length === 0) return null;

  // Group logs by date
  const byDate = new Map<string, Map<string, CrmCustomLog>>();
  for (const log of history) {
    if (!byDate.has(log.log_date)) byDate.set(log.log_date, new Map());
    byDate.get(log.log_date)!.set(log.field_id, log);
  }

  const today     = new Date().toISOString().split("T")[0];
  const pastDates = [...byDate.keys()]
    .filter(d => d !== today)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 14);

  if (pastDates.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-[#4b5563]" />
        <h2 className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest">History</h2>
      </div>

      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth: `${200 + activeFields.length * 110}px` }}>
          <thead>
            <tr className="border-b border-[#1e2130]">
              <th className="px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider text-left whitespace-nowrap">
                Date
              </th>
              {activeFields.map(f => (
                <th
                  key={f.id}
                  className="px-3 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider text-right whitespace-nowrap"
                >
                  {f.field_label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2130]">
            {pastDates.map(date => {
              const logsForDate = byDate.get(date)!;
              return (
                <tr key={date} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 text-[#6b7280] text-xs whitespace-nowrap">
                    {formatDate(date)}
                  </td>
                  {activeFields.map(f => {
                    const log = logsForDate.get(f.id);
                    return (
                      <td key={f.id} className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">
                        {log ? formatValue(log, f) : <span className="text-[#374151]">—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
