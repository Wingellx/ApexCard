// TEMP: preview route for screenshot only
import { Target } from "lucide-react";
import GoalsForm from "@/components/dashboard/GoalsForm";
import Sidebar from "@/components/dashboard/Sidebar";

export default function PreviewGoalsPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] flex">
      <Sidebar userName="Preview" userEmail="" userRole="Closer" userInitial="P" streak={0} />
      <div className="ml-60 px-8 py-8 w-full max-w-[1200px]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Goals</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">Set your monthly targets. Saving overwrites any existing goals for that month.</p>
          </div>
        </div>
        <GoalsForm
          initialMonth="2026-04"
          existing={{
            calls_target: 120,
            show_rate_target: 80,
            close_rate_target: 35,
            offers_target: 40,
            cash_target: 100000,
            commission_target: 15000,
          }}
        />
      </div>
    </div>
  );
}
