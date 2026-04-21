import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserTeam } from "@/lib/queries";
import { getMySubmissions } from "@/lib/crm-queries";
import SubmissionForm from "@/components/crm/SubmissionForm";
import { FileText, TrendingUp, Users } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  new_lead:       "New Lead",
  contacted:      "Contacted",
  follow_up:      "Follow Up",
  interested:     "Interested",
  not_interested: "Not Interested",
  closed:         "Closed",
};

const STATUS_COLOURS: Record<string, string> = {
  new_lead:       "bg-[#1e2130] text-[#9ca3af]",
  contacted:      "bg-indigo-500/10 text-indigo-300",
  follow_up:      "bg-amber-500/10 text-amber-300",
  interested:     "bg-emerald-500/10 text-emerald-300",
  not_interested: "bg-rose-500/10 text-rose-300",
  closed:         "bg-violet-500/10 text-violet-300",
};

const OUTCOME_COLOURS: Record<string, string> = {
  pending: "text-[#6b7280]",
  won:     "text-emerald-400",
  lost:    "text-rose-400",
};

type Submission = Record<string, unknown>;

function SubmissionRow({ s }: { s: Submission }) {
  const status  = s.status  as string;
  const outcome = s.outcome as string;
  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl px-4 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#f0f2f8] truncate">
          {s.contact_name as string}
          {s.company ? <span className="text-[#6b7280] font-normal"> · {s.company as string}</span> : null}
        </p>
        {s.notes ? <p className="text-xs text-[#4b5563] mt-0.5 truncate">{s.notes as string}</p> : null}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOURS[status] ?? ""}`}>
          {STATUS_LABELS[status] ?? status}
        </span>
        {outcome !== "pending" && (
          <span className={`text-xs font-semibold ${OUTCOME_COLOURS[outcome]}`}>
            {outcome === "won" ? "Won" : "Lost"}
          </span>
        )}
        {(s.deal_value as number | null) != null && (
          <span className="text-xs text-[#9ca3af]">£{Number(s.deal_value).toLocaleString()}</span>
        )}
      </div>
    </div>
  );
}

export default async function CRMPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const userTeam = await getUserTeam(user.id);

  if (!userTeam) {
    return (
      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px]">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">CRM</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">Log and track your daily contacts.</p>
        </div>
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center">
          <Users className="w-8 h-8 text-[#374151] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#f0f2f8] mb-1">You&apos;re not on a team yet</p>
          <p className="text-sm text-[#6b7280]">Ask your manager to send you an invite link to get started.</p>
        </div>
      </div>
    );
  }

  const submissions = await getMySubmissions(user.id);
  const today       = new Date().toISOString().split("T")[0];
  const todayEntries = submissions.filter(s => s.submission_date === today);
  const past         = submissions.filter(s => s.submission_date !== today);

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[900px] space-y-6">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">CRM</h1>
          <p className="text-sm text-[#6b7280] mt-0.5">{userTeam.team.name}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#4b5563]">
          <FileText className="w-4 h-4" />
          <span>{submissions.length} total</span>
        </div>
      </div>

      <SubmissionForm />

      {todayEntries.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest mb-3">Today</h2>
          <div className="space-y-2">
            {todayEntries.map(s => <SubmissionRow key={s.id as string} s={s} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-[#4b5563]" />
            <h2 className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest">History</h2>
          </div>
          <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2130]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Contact</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider hidden sm:table-cell">Company</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider hidden sm:table-cell">Deal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2130]">
                {past.map(s => (
                  <tr key={s.id as string} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-[#6b7280] text-xs whitespace-nowrap">{s.submission_date as string}</td>
                    <td className="px-4 py-3 text-[#f0f2f8] font-medium">
                      {s.contact_name as string}
                      {s.outcome !== "pending" && (
                        <span className={`ml-2 text-xs ${OUTCOME_COLOURS[s.outcome as string]}`}>
                          {s.outcome === "won" ? "✓" : "✗"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#6b7280] hidden sm:table-cell">{(s.company as string) ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOURS[s.status as string] ?? ""}`}>
                        {STATUS_LABELS[s.status as string] ?? s.status as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#9ca3af] text-xs hidden sm:table-cell">
                      {s.deal_value != null ? `£${Number(s.deal_value).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {submissions.length === 0 && (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center">
          <FileText className="w-8 h-8 text-[#374151] mx-auto mb-3" />
          <p className="text-sm text-[#6b7280]">No entries yet. Log your first contact above.</p>
        </div>
      )}

    </div>
  );
}
