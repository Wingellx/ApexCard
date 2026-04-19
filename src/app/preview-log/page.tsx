// TEMP: preview route for screenshot only
import { ClipboardList } from "lucide-react";
import LogCallsForm from "@/components/dashboard/LogCallsForm";
import Sidebar from "@/components/dashboard/Sidebar";

export default function PreviewLogPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] flex">
      <Sidebar userName="Preview" userEmail="" userRole="Closer" userInitial="P" streak={0} />
      <div className="ml-60 px-8 py-8 w-full max-w-[1200px]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Log Calls</h1>
            <p className="text-sm text-[#6b7280] mt-0.5">Enter today&apos;s numbers. Logging for the same date will overwrite the existing entry.</p>
          </div>
        </div>
        <LogCallsForm />
      </div>
    </div>
  );
}
