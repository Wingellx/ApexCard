// TEMP: preview of empty state dashboard
import { PhoneCall, TrendingUp, Target, DollarSign, Handshake, Wallet, CalendarDays, Plus } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import { NoLogsState, NoGoalsState } from "@/components/dashboard/EmptyState";
import Sidebar from "@/components/dashboard/Sidebar";

const metrics = [
  { label: "Calls Taken",     value: "—", subvalue: "No logs yet", icon: PhoneCall,  accent: "indigo"  as const },
  { label: "Show Rate",       value: "—", subvalue: "No logs yet", icon: TrendingUp, accent: "emerald" as const },
  { label: "Close Rate",      value: "—", subvalue: "No logs yet", icon: Target,     accent: "amber"   as const },
  { label: "Offers Made",     value: "—", subvalue: "No logs yet", icon: Handshake,  accent: "cyan"    as const },
  { label: "Cash Collected",  value: "—", subvalue: "No logs yet", icon: DollarSign, accent: "emerald" as const },
  { label: "Commission Earned", value: "—", subvalue: "No logs yet", icon: Wallet,   accent: "violet"  as const },
];

export default function PreviewEmptyPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] flex">
      <Sidebar userName="Preview" userEmail="" userRole="Closer" userInitial="P" streak={0} />
      <div className="ml-60 px-8 py-8 w-full max-w-[1400px]">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Saturday, April 18
            </p>
            <h1 className="text-3xl font-extrabold text-[#f0f2f8] tracking-tight">Good morning, Alex 👋</h1>
            <p className="text-sm text-[#6b7280] mt-1">Welcome! Log your first calls to get started.</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> Log Today
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
        </div>
        <div className="mb-6"><NoLogsState /></div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-1"><NoGoalsState /></div>
          <div className="xl:col-span-2 bg-[#111318] border border-dashed border-[#1e2130] rounded-xl flex items-center justify-center p-10 min-h-[200px]">
            <p className="text-sm text-[#6b7280]">Recent call logs will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
