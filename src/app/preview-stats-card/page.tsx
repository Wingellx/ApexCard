// TEMP: preview of public stats card
import { PhoneCall, Target, DollarSign, Handshake, Wallet, Trophy, CalendarDays } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function StatCard({ icon, label, value, accent = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="bg-[#0d0f15] border border-[#1e2130] rounded-xl p-5 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${accent}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );
}

export default function PreviewStatsCard() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] flex flex-col items-center justify-start py-16 px-6">
      <div className="flex items-center gap-2 mb-10">
        <img src="/logo.svg" alt="ApexCard" className="w-7 h-7" />
        <span className="text-sm font-bold text-[#6b7280]">ApexCard</span>
      </div>
      <div className="w-full max-w-2xl">
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-8 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-2">Sales Performance</p>
                <h1 className="text-3xl font-extrabold text-[#f0f2f8] tracking-tight">Alex Johnson</h1>
                <p className="text-sm text-[#6b7280] mt-1">142 days logged</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 text-right">
                <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-0.5">Lifetime Cash</p>
                <p className="text-2xl font-extrabold text-emerald-400 tabular-nums">$487,200</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Show Rate",    value: "79.2%", color: "text-emerald-400" },
                { label: "Close Rate",   value: "31.4%", color: "text-indigo-400"  },
                { label: "Cash / Close", value: "$3,430", color: "text-emerald-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-[#0d0f15] border border-[#1e2130] rounded-xl px-4 py-3 text-center">
                  <p className="text-[10px] text-[#6b7280] uppercase tracking-wider mb-1">{label}</p>
                  <p className={`text-xl font-extrabold tabular-nums ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <StatCard icon={<PhoneCall className="w-4 h-4" />}  label="Calls Taken"       value="2,847" accent="text-indigo-400 bg-indigo-500/10 border-indigo-500/20" />
          <StatCard icon={<Handshake className="w-4 h-4" />}  label="Offers Made"       value="1,134" accent="text-amber-400 bg-amber-500/10 border-amber-500/20" />
          <StatCard icon={<Target className="w-4 h-4" />}     label="Deals Closed"      value="356"   accent="text-emerald-400 bg-emerald-500/10 border-emerald-500/20" />
          <StatCard icon={<Wallet className="w-4 h-4" />}     label="Commission Earned" value="$73,080" accent="text-violet-400 bg-violet-500/10 border-violet-500/20" />
          <StatCard icon={<Trophy className="w-4 h-4" />}     label="Best Single Day"   value="$18,400" accent="text-amber-400 bg-amber-500/10 border-amber-500/20" />
          <StatCard icon={<CalendarDays className="w-4 h-4" />} label="Days Logged"     value="142"   accent="text-cyan-400 bg-cyan-500/10 border-cyan-500/20" />
        </div>
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-[#6b7280]">Powered by ApexCard</p>
          <span className="text-xs text-indigo-400 font-medium">Build your own →</span>
        </div>
      </div>
    </div>
  );
}
