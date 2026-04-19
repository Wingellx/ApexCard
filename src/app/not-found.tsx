import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
        <BarChart3 className="w-8 h-8 text-indigo-400" />
      </div>

      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">404</p>
      <h1 className="text-4xl font-extrabold text-[#f0f2f8] tracking-tight mb-3">
        Page not found
      </h1>
      <p className="text-[#6b7280] max-w-sm mb-10">
        This page doesn&apos;t exist or was moved. Check the URL or head back to your dashboard.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-[#111318] hover:bg-[#1a1d27] border border-[#1e2130] text-[#f0f2f8] text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
