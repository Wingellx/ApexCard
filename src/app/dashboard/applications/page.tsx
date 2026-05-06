import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyApplications } from "@/lib/offers-queries";
import { FileText, Briefcase, CheckCircle2, Eye, X, Clock, ChevronRight } from "lucide-react";

const STATUS_CONFIG = {
  submitted: { label: "Submitted", cls: "text-[#6b7280] bg-white/[0.04] border-[#1e2130]" },
  viewed:    { label: "Viewed",    cls: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  interview: { label: "Interview", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  accepted:  { label: "Accepted",  cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  declined:  { label: "Declined",  cls: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
};

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.submitted;
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function daysUntil(isoDate: string) {
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000));
}

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const applications = await getMyApplications(user.id);

  return (
    <div className="px-4 sm:px-8 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">My Applications</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{applications.length} application{applications.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-[#111318] border border-dashed border-[#1e2130] rounded-xl py-16 text-center shadow-lg shadow-black/20">
          <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-sm font-semibold text-zinc-200 mb-1">No applications yet</p>
          <p className="text-sm text-zinc-500 mb-5 max-w-xs mx-auto">Browse the offer board and apply to roles you qualify for.</p>
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors duration-150"
          >
            <Briefcase className="w-4 h-4" /> Browse Offer Board
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const days = daysUntil(app.expires_at);
            const expiringSoon = days <= 2 && app.status === "submitted";

            return (
              <div
                key={app.id}
                className="bg-[#0f1117] border border-[#1e2130] rounded-2xl p-4 hover:bg-[#111520] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#f0f2f8] truncate">{app.offer_title}</p>
                    <p className="text-xs text-cyan-400/70 font-semibold mt-0.5">{app.offer_company}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#4b5563]">
                    <Clock className="w-3 h-3" />
                    Applied {new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {app.status === "submitted" || app.status === "viewed" ? (
                    <span className={`flex items-center gap-1.5 text-[11px] ${expiringSoon ? "text-amber-400" : "text-[#374151]"}`}>
                      <CalendarCountdown className="w-3 h-3" />
                      Expires in {days} day{days !== 1 ? "s" : ""}
                      {expiringSoon && " ⚠"}
                    </span>
                  ) : null}
                </div>


              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <Link href="/offers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-violet-400 transition-colors duration-150">
          <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to Offer Board
        </Link>
      </div>
    </div>
  );
}

function CalendarCountdown({ className }: { className?: string }) {
  return <Clock className={className} />;
}
