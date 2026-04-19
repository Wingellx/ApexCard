import { History, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAllCallLogs } from "@/lib/queries";
import CallHistoryTable from "@/components/dashboard/CallHistoryTable";
import Link from "next/link";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const logs = user ? await getAllCallLogs(user.id) : [];

  const totalCash = logs.reduce((s, r) => s + Number(r.cash_collected ?? 0), 0);
  const fmtCash = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalCash);

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1400px]">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Call History</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">
              {logs.length} {logs.length === 1 ? "entry" : "entries"} · {fmtCash} lifetime cash
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <a
              href="/api/export/logs"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] hover:text-[#f0f2f8] border border-[#1e2130] hover:border-[#2a2f45] px-3 py-2 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </a>
          )}
          <Link
            href="/dashboard/log"
            className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            + Log Today
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <CallHistoryTable logs={logs as Parameters<typeof CallHistoryTable>[0]["logs"]} />
      </div>
    </div>
  );
}
