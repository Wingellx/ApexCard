import { getSetterClosedCalls, getSetterPreferences } from "@/lib/crm-queries";
import { saveSetterPreferences } from "@/app/dashboard/crm/actions";
import ClosedCallForm from "./ClosedCallForm";
import { DollarSign, Settings } from "lucide-react";

interface Props {
  userId: string;
  teamId: string;
}

export default async function ClosedCallsSection({ userId, teamId }: Props) {
  const [calls, prefs] = await Promise.all([
    getSetterClosedCalls(userId, teamId),
    getSetterPreferences(userId),
  ]);

  const defaultPct     = prefs?.default_commission_pct ?? 10;
  const totalCommission = calls.reduce((sum, c) => sum + Number(c.commission_earned), 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign className="w-3.5 h-3.5 text-[#4b5563]" />
        <h2 className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest">Closed Calls</h2>
      </div>

      {/* Total commission */}
      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-[#4b5563] uppercase tracking-wider mb-1">Total Commission Earned</p>
          <p className="text-2xl font-bold text-emerald-400">${totalCommission.toFixed(2)}</p>
        </div>
        <p className="text-xs text-[#4b5563]">
          {calls.length} call{calls.length !== 1 ? "s" : ""} logged
        </p>
      </div>

      {/* Default commission settings */}
      <details className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden group">
        <summary className="flex items-center gap-2 px-5 py-3.5 cursor-pointer text-xs font-semibold text-[#6b7280] hover:text-[#9ca3af] select-none list-none">
          <Settings className="w-3.5 h-3.5 shrink-0" />
          Default Commission %
          <span className="ml-auto text-indigo-400">{defaultPct}%</span>
        </summary>
        <div className="px-5 pb-5 border-t border-[#1e2130] pt-4">
          <form action={saveSetterPreferences} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
                Default Commission %
              </label>
              <input
                name="default_commission_pct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                defaultValue={String(defaultPct)}
                className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-2.5 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shrink-0"
            >
              Save
            </button>
          </form>
        </div>
      </details>

      {/* Log form */}
      <ClosedCallForm defaultCommissionPct={defaultPct} />

      {/* History table */}
      {calls.length > 0 && (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[#1e2130]">
                {["Date", "Lead Name", "Closer", "Closed Amt", "Comm %", "Commission"].map(h => (
                  <th
                    key={h}
                    className="px-3 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider text-right first:text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2130]">
              {calls.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-3 py-2.5 text-[#6b7280] text-xs whitespace-nowrap">{c.date_closed}</td>
                  <td className="px-3 py-2.5 text-[#f0f2f8] text-xs font-medium">{c.lead_name}</td>
                  <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{c.closer_name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">
                    ${Number(c.closed_amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-[#9ca3af] text-xs text-right">{c.commission_pct}%</td>
                  <td className="px-3 py-2.5 text-emerald-400 text-xs text-right font-semibold">
                    ${Number(c.commission_earned).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
