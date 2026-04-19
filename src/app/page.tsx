import Link from "next/link";
import { getWaitlistCount } from "@/app/actions/waitlist";
import WaitlistForm from "@/components/marketing/WaitlistForm";
import { BarChart3, PhoneCall, Shield, TrendingUp } from "lucide-react";

export const revalidate = 60;

export default async function WaitlistPage() {
  const count = await getWaitlistCount();

  return (
    <div className="min-h-screen bg-[#0a0b0f] flex flex-col">

      {/* Minimal nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e2130]/60 bg-[#0a0b0f]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="ApexCard" className="w-7 h-7" />
            <span className="font-bold text-base tracking-tight text-[#f0f2f8]">ApexCard</span>
          </div>
          <Link
            href="/auth/login"
            className="text-xs font-semibold text-[#6b7280] hover:text-[#f0f2f8] transition-colors"
          >
            Sign in →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-20 relative overflow-hidden">

        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/8 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-violet-500/6 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-2xl mx-auto text-center space-y-10">

          {/* Label */}
          <div className="animate-in inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Coming soon
          </div>

          {/* Headline */}
          <div className="space-y-4 animate-in" style={{ animationDelay: "60ms" }}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#f0f2f8] leading-[1.04]">
              Your verified<br />
              <span className="text-indigo-400">sales identity.</span>
            </h1>
            <p className="text-lg text-[#6b7280] max-w-lg mx-auto leading-relaxed">
              The performance dashboard for high-ticket closers, setters, and operators.
              Track your numbers, get manager-verified, and share a card that proves your track record.
            </p>
          </div>

          {/* Waitlist form */}
          <div className="animate-in" style={{ animationDelay: "120ms" }}>
            <WaitlistForm initialCount={count} />
          </div>

          {/* Feature pills */}
          <div className="animate-in flex flex-wrap items-center justify-center gap-2.5" style={{ animationDelay: "180ms" }}>
            {[
              { icon: PhoneCall,   label: "Call tracking"         },
              { icon: TrendingUp,  label: "Close rate analytics"  },
              { icon: BarChart3,   label: "Commission tracker"    },
              { icon: Shield,      label: "Manager verification"  },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6b7280] bg-[#111318] border border-[#1e2130] px-3 py-1.5 rounded-full"
              >
                <Icon className="w-3 h-3 text-indigo-400/70" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e2130]/60 py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4b5563]">
          <p>© {new Date().getFullYear()} ApexCard. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[#6b7280] transition-colors">Privacy Policy</Link>
            <Link href="/terms"   className="hover:text-[#6b7280] transition-colors">Terms of Service</Link>
            <Link href="/auth/login" className="hover:text-[#6b7280] transition-colors">Early access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
