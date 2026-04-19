import { XCircle } from "lucide-react";

export default function DeclinedPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] flex flex-col items-center justify-center px-6">
      <div className="animate-in flex items-center gap-2 mb-10">
        <img src="/logo.svg" alt="ApexCard" className="w-7 h-7" />
        <span className="text-sm font-bold text-[#6b7280]">ApexCard</span>
      </div>
      <div className="animate-in bg-[#111318] border border-[#1e2130] rounded-2xl p-10 text-center max-w-md w-full" style={{ animationDelay: "120ms" }}>
        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <XCircle className="w-7 h-7 text-rose-400" />
        </div>
        <h1 className="text-xl font-extrabold text-[#f0f2f8] mb-2">Request declined</h1>
        <p className="text-sm text-[#6b7280] leading-relaxed">
          You&apos;ve declined the verification request. The rep has been notified and no stats have been verified.
        </p>
      </div>
    </div>
  );
}
