import { ClipboardList } from "lucide-react";
import LogCallsForm from "@/components/dashboard/LogCallsForm";

export default function LogCallsPage() {
  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Log Calls</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">
            Enter today&apos;s numbers. Logging for the same date will overwrite the existing entry.
          </p>
        </div>
      </div>

      <LogCallsForm />
    </div>
  );
}
