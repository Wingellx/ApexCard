import Link from "next/link";
import { ClipboardList, Target } from "lucide-react";

export function NoLogsState() {
  return (
    <div className="bg-[#111318] border border-dashed border-[#1e2130] rounded-xl p-10 flex flex-col items-center text-center shadow-lg shadow-black/20">
      <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mb-4">
        <ClipboardList className="w-6 h-6 text-violet-400" />
      </div>
      <p className="text-sm font-semibold text-zinc-200 mb-1">No calls logged yet</p>
      <p className="text-sm text-zinc-500 mb-5 max-w-xs">
        Log your first day of calls to start seeing your metrics and track progress toward your goals.
      </p>
      <Link
        href="/dashboard/log"
        className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-150"
      >
        <ClipboardList className="w-4 h-4" />
        Log today&apos;s calls
      </Link>
    </div>
  );
}

export function NoGoalsState() {
  return (
    <div className="bg-[#111318] border border-dashed border-[#1e2130] rounded-xl p-8 flex flex-col items-center text-center h-full justify-center shadow-lg shadow-black/20">
      <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mb-3">
        <Target className="w-5 h-5 text-violet-400" />
      </div>
      <p className="text-sm font-semibold text-zinc-200 mb-1">No goals set</p>
      <p className="text-sm text-zinc-500 mb-4 max-w-[200px]">
        Set your monthly targets to track progress here.
      </p>
      <Link
        href="/dashboard/goals"
        className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors duration-150"
      >
        Set goals →
      </Link>
    </div>
  );
}
