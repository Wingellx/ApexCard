import Link from "next/link";
import { Mail } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center px-6">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm text-center">
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <img src="/logo.svg" alt="ApexCard" className="w-9 h-9" />
          <span className="font-bold text-xl tracking-tight text-[#f0f2f8]">ApexCard</span>
        </Link>

        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-8">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Mail className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-xl font-extrabold text-[#f0f2f8] tracking-tight mb-2">Check your email</h1>
          <p className="text-sm text-[#6b7280] leading-relaxed mb-6">
            We&apos;ve sent you a confirmation link. Click it to verify your email and activate your account.
          </p>
          <p className="text-xs text-[#374151]">
            Didn&apos;t receive it? Check your spam folder, or{" "}
            <Link href="/auth/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              try signing up again
            </Link>
            .
          </p>
        </div>

        <p className="text-center text-sm text-[#6b7280] mt-6">
          Already confirmed?{" "}
          <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
