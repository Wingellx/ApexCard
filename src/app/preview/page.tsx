// TEMP: preview-only page for screenshots
import { PhoneCall, TrendingUp, Target, DollarSign, Handshake, Wallet, CalendarDays, Plus } from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import GoalsCard from "@/components/dashboard/GoalsCard";
import RecentLogs from "@/components/dashboard/RecentLogs";
import DailyCashChart from "@/components/dashboard/DailyCashChart";
import CloseRateTrendChart from "@/components/dashboard/CloseRateTrendChart";
import StreakBadge from "@/components/dashboard/StreakBadge";
import Sidebar from "@/components/dashboard/Sidebar";

const metrics = [
  { label: "Calls Taken",       value: "94",      subvalue: "72 showed",          change: 16,  icon: PhoneCall,  accent: "indigo"  as const },
  { label: "Show Rate",         value: "76.4%",   subvalue: "72 of 94 calls",     change: 4,   icon: TrendingUp, accent: "emerald" as const },
  { label: "Close Rate",        value: "30.6%",   subvalue: "22 of 72 shows",     change: -2,  icon: Target,     accent: "amber"   as const },
  { label: "Offers Made",       value: "28",      subvalue: "22 closed",          change: 10,  icon: Handshake,  accent: "cyan"    as const },
  { label: "Cash Collected",    value: "$68,400", subvalue: "across 22 closes",   change: 22,  icon: DollarSign, accent: "emerald" as const },
  { label: "Commission Earned", value: "$10,260", subvalue: "15% rate",           change: 18,  icon: Wallet,     accent: "violet"  as const },
];
const goals = [
  { label: "Calls Taken",    actual: 94,    target: 120,    format: "number"   as const },
  { label: "Show Rate",      actual: 76.4,  target: 80,     format: "percent"  as const },
  { label: "Close Rate",     actual: 30.6,  target: 35,     format: "percent"  as const },
  { label: "Offers Made",    actual: 28,    target: 40,     format: "number"   as const },
  { label: "Cash Collected", actual: 68400, target: 100000, format: "currency" as const },
  { label: "Commission",     actual: 10260, target: 15000,  format: "currency" as const },
];
const recentLogs = [
  { date: "Apr 18", calls: 12, shows: 10, offersMade: 5, offersTaken: 3, cash: 9200,  commission: 1380 },
  { date: "Apr 17", calls: 9,  shows: 7,  offersMade: 4, offersTaken: 2, cash: 5800,  commission: 870  },
  { date: "Apr 16", calls: 14, shows: 11, offersMade: 6, offersTaken: 4, cash: 12200, commission: 1830 },
  { date: "Apr 15", calls: 8,  shows: 5,  offersMade: 3, offersTaken: 1, cash: 3100,  commission: 465  },
  { date: "Apr 14", calls: 11, shows: 9,  offersMade: 5, offersTaken: 3, cash: 8700,  commission: 1305 },
];

// Build 18 days of bar chart data
const dailyCash = Array.from({ length: 18 }, (_, i) => ({
  date: String(i + 1),
  cash: [0,0,9200,5800,12200,3100,8700,0,7400,11200,0,6800,9100,4200,13800,0,8300,9200][i] ?? 0,
}));

const closeRateTrend = [
  { date: "Mar 20", closeRate: 22 }, { date: "Mar 22", closeRate: 25 },
  { date: "Mar 25", closeRate: 28 }, { date: "Mar 28", closeRate: 30 },
  { date: "Apr 1",  closeRate: 27 }, { date: "Apr 4",  closeRate: 33 },
  { date: "Apr 7",  closeRate: 29 }, { date: "Apr 10", closeRate: 31 },
  { date: "Apr 14", closeRate: 34 }, { date: "Apr 16", closeRate: 30 },
  { date: "Apr 18", closeRate: 31 },
];

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] flex">
      <Sidebar userName="Preview" userEmail="" userRole="Closer" userInitial="P" streak={0} />
      <div className="ml-60 px-8 py-8 w-full max-w-[1400px]">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-widest flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Saturday, April 18
              </p>
              <StreakBadge streak={7} />
            </div>
            <h1 className="text-3xl font-extrabold text-[#f0f2f8] tracking-tight">Good morning, Alex 👋</h1>
            <p className="text-sm text-[#6b7280] mt-1">Here&apos;s how April is shaping up.</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> Log Today
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {metrics.map((m) => <MetricCard key={m.label} {...m} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <DailyCashChart data={dailyCash} />
          <CloseRateTrendChart data={closeRateTrend} avgCloseRate={30.0} />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          <div className="xl:col-span-1"><GoalsCard goals={goals} period="April 2026" /></div>
          <div className="xl:col-span-2"><RecentLogs logs={recentLogs} /></div>
        </div>
        <div className="bg-[#111318] border border-indigo-500/20 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-sm text-[#f0f2f8]">
              You&apos;re at <span className="font-bold text-amber-400">68%</span> of your monthly cash goal with{" "}
              <span className="font-bold text-[#f0f2f8]">12 days left</span> in April.
              You need <span className="font-bold text-emerald-400">$2,633/day</span> to hit target.
            </p>
          </div>
          <span className="text-xs text-indigo-400 font-semibold whitespace-nowrap ml-6">Edit goals →</span>
        </div>
      </div>
    </div>
  );
}
