import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPendingOwnerRequests } from "@/lib/queries";
import { ApproveForm, RejectForm } from "./AdminActions";
import { CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "xwingell@gmail.com";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "pending"  ? "text-amber-400 bg-amber-500/10 border-amber-500/20"      :
    status === "approved" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                            "text-rose-400 bg-rose-500/10 border-rose-500/20";
  const Icon = status === "pending" ? Clock : status === "approved" ? CheckCircle2 : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${styles}`}>
      <Icon className="w-2.5 h-2.5" />
      {status}
    </span>
  );
}

type Request = Awaited<ReturnType<typeof getPendingOwnerRequests>>[number];

function RequestCard({ r, showActions }: { r: Request; showActions: boolean }) {
  return (
    <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-bold text-[#f0f2f8]">{r.full_name}</p>
            <StatusBadge status={r.status} />
          </div>
          <p className="text-xs text-[#6b7280]">{r.profiles?.email ?? r.user_id}</p>
          <p className="text-xs text-[#4b5563] mt-0.5">Submitted {formatDate(r.created_at)}</p>
        </div>
        {r.company_website && (
          <a
            href={r.company_website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {r.company_name}
          </a>
        )}
      </div>

      <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-3 text-sm text-[#9ca3af] leading-relaxed">
        {r.offer_description}
      </div>

      {showActions && (
        <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-white/[0.04]">
          <ApproveForm requestId={r.id} userId={r.user_id} />
          <RejectForm requestId={r.id} />
        </div>
      )}
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect("/");

  const requests = await getPendingOwnerRequests();
  const pending  = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-[#080a0e] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-1">ApexCard Admin</p>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">Owner Verification Queue</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            {pending.length} pending · {reviewed.length} reviewed
          </p>
        </div>

        {/* Pending */}
        {pending.length === 0 ? (
          <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl py-12 text-center mb-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/30 mx-auto mb-3" />
            <p className="text-sm text-[#374151]">No pending requests.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">
              Pending ({pending.length})
            </p>
            {pending.map((r) => <RequestCard key={r.id} r={r} showActions />)}
          </div>
        )}

        {/* Reviewed */}
        {reviewed.length > 0 && (
          <div className="space-y-4">
            <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">
              Reviewed ({reviewed.length})
            </p>
            {reviewed.map((r) => <RequestCard key={r.id} r={r} showActions={false} />)}
          </div>
        )}
      </div>
    </div>
  );
}
