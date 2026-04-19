import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import Button from "@/components/ui/Button";
import {
  TrendingUp,
  PhoneCall,
  Target,
  DollarSign,
  BarChart3,
  CheckCircle2,
  Zap,
  Shield,
  Users,
} from "lucide-react";

const features = [
  {
    icon: PhoneCall,
    title: "Call Tracking",
    description: "Log every call, show, and offer in seconds. Know exactly where your pipeline stands.",
  },
  {
    icon: Target,
    title: "Close Rate Analytics",
    description: "See your show rate, close rate, and offer conversion in real time. Spot patterns, fix leaks.",
  },
  {
    icon: DollarSign,
    title: "Commission Tracker",
    description: "Cash collected and commission earned — always up to date. No more spreadsheet math.",
  },
  {
    icon: BarChart3,
    title: "Goals vs. Actuals",
    description: "Set daily, weekly, or monthly targets. Track your pace and close the gap before the period ends.",
  },
  {
    icon: Zap,
    title: "Instant Entry",
    description: "Manual data entry designed for speed. Log a full call day in under 60 seconds.",
  },
  {
    icon: Users,
    title: "Built for Teams",
    description: "Closers, appointment setters, and operators each get the view that's relevant to their role.",
  },
];

const stats = [
  { value: "23%", label: "avg close rate lift in 90 days" },
  { value: "4.8×", label: "ROI reported by users" },
  { value: "2 min", label: "average daily log time" },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    description: "Perfect for solo closers getting dialed in.",
    features: [
      "Full personal dashboard",
      "Unlimited call logs",
      "Goals & actuals tracking",
      "30-day history",
      "Email support",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    description: "For serious performers tracking every dollar.",
    features: [
      "Everything in Starter",
      "Unlimited history",
      "Commission forecasting",
      "CSV export",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$199",
    period: "/mo",
    description: "For operators managing a full sales floor.",
    features: [
      "Everything in Pro",
      "Up to 10 seats",
      "Manager overview",
      "Team leaderboard",
      "Dedicated onboarding",
    ],
    cta: "Contact us",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="animate-in inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 uppercase tracking-wider">
            <Zap className="w-3 h-3" />
            Built for closers, setters &amp; operators
          </div>

          <h1 className="animate-in text-5xl md:text-7xl font-extrabold tracking-tight text-[#f0f2f8] leading-[1.05] mb-6" style={{ animationDelay: "80ms" }}>
            Your verified<br />
            <span className="text-indigo-400">sales identity.</span>
          </h1>

          <p className="animate-in text-lg md:text-xl text-[#6b7280] max-w-2xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: "160ms" }}>
            ApexCard is the performance dashboard for high-ticket sales teams.
            Track calls, show rates, close rates, and commissions — then get manager-verified and share your card.
          </p>

          <div className="animate-in flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animationDelay: "240ms" }}>
            <Link href="/auth/signup">
              <Button size="lg">Start for free — no card needed</Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg">See how it works</Button>
            </Link>
          </div>

          <p className="animate-in mt-8 text-xs text-[#6b7280]" style={{ animationDelay: "320ms" }}>
            No credit card required · Cancel anytime · 14-day free trial
          </p>
        </div>

        {/* Mock Dashboard Preview */}
        <div className="animate-in relative max-w-5xl mx-auto mt-20" style={{ animationDelay: "420ms" }}>
          <div className="rounded-2xl border border-[#1e2130] bg-[#111318] overflow-hidden shadow-2xl shadow-black/60">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e2130] bg-[#0d0f15]">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="flex-1 mx-4 bg-[#1e2130] rounded-md h-5" />
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Calls Taken", value: "47", change: "+12%" },
                { label: "Show Rate", value: "78.3%", change: "+4.2%" },
                { label: "Close Rate", value: "31.9%", change: "+2.8%" },
                { label: "Cash Collected", value: "$41,200", change: "+18%" },
              ].map((metric) => (
                <div key={metric.label} className="bg-[#0d0f15] border border-[#1e2130] rounded-xl p-4">
                  <p className="text-xs text-[#6b7280] uppercase tracking-wider mb-2">{metric.label}</p>
                  <p className="text-2xl font-bold text-[#f0f2f8]">{metric.value}</p>
                  <p className="text-xs text-emerald-400 mt-1">{metric.change} this week</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-[#0d0f15] border border-[#1e2130] rounded-xl p-4 h-32 flex items-center justify-center">
                <p className="text-xs text-[#6b7280]">Performance chart</p>
              </div>
              <div className="bg-[#0d0f15] border border-[#1e2130] rounded-xl p-4 h-32 flex items-center justify-center">
                <p className="text-xs text-[#6b7280]">Goals vs actuals</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-indigo-500/15 blur-3xl rounded-full pointer-events-none" />
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-[#1e2130] bg-[#111318] py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-extrabold text-indigo-400 mb-1">{stat.value}</p>
              <p className="text-sm text-[#6b7280]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#f0f2f8] tracking-tight mb-4">
              Everything you need to perform
            </h2>
            <p className="text-[#6b7280] max-w-xl mx-auto">
              No bloat. No generic CRM nonsense. Just the metrics that matter for high-ticket sales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-[#111318] border border-[#1e2130] rounded-xl p-6 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-[#f0f2f8] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-[#111318] border-y border-[#1e2130]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Results</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#f0f2f8] tracking-tight">
              Closers who use data, win
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "I went from guessing my numbers to knowing exactly why I had a bad week. ApexCard made it obvious.",
                name: "Marcus R.",
                role: "High-ticket closer, $30K/mo",
              },
              {
                quote: "My show rate was tanking and I had no idea. Two weeks in, I caught the pattern and fixed it.",
                name: "Taylor K.",
                role: "Appointment setter, SaaS",
              },
              {
                quote: "Running a 6-person sales team without this was madness. Now I can see who's dialed in and who needs coaching.",
                name: "Jordan M.",
                role: "Sales operator, coaching offer",
              },
            ].map((t) => (
              <div key={t.name} className="bg-[#0d0f15] border border-[#1e2130] rounded-xl p-6">
                <p className="text-[#f0f2f8] text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-sm text-[#f0f2f8]">{t.name}</p>
                  <p className="text-xs text-[#6b7280]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#f0f2f8] tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-[#6b7280]">14-day free trial on all plans. No credit card required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-8 flex flex-col ${
                  plan.highlighted
                    ? "border-indigo-500 bg-indigo-500/5 shadow-xl shadow-indigo-500/10"
                    : "border-[#1e2130] bg-[#111318]"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <p className="font-bold text-[#f0f2f8] text-lg mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-[#f0f2f8]">{plan.price}</span>
                    <span className="text-[#6b7280] mb-1">{plan.period}</span>
                  </div>
                  <p className="text-sm text-[#6b7280]">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-[#6b7280]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/auth/signup">
                  <Button
                    variant={plan.highlighted ? "primary" : "secondary"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#f0f2f8] tracking-tight mb-4">
            Ready to know your numbers?
          </h2>
          <p className="text-[#6b7280] text-lg mb-10">
            Start your free trial today. No card required. Be dialed in before your next call.
          </p>
          <Link href="/auth/signup">
            <Button size="lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              Get started for free
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
