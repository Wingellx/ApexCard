import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function VerifiedPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm text-center">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <img src="/logo.svg" alt="ApexCard" className="w-9 h-9" />
          <span className="font-bold text-xl tracking-tight text-[#f0f2f8]">ApexCard</span>
        </Link>

        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-8">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-extrabold text-[#f0f2f8] tracking-tight mb-2">Email confirmed</h1>
          <p className="text-sm text-[#6b7280] leading-relaxed mb-6">
            Your email has been verified. Let&apos;s set up your ApexCard profile.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            Continue to Onboarding
          </Link>
        </div>

        <p className="text-center text-sm text-[#6b7280] mt-6">
          Already set up?{" "}
          <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Go to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
