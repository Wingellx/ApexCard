import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserTeam, getUserTeamRole } from "@/lib/queries";
import { getCRMSubmissions, getCRMTeamMembers, getManagerInviteTokens } from "@/lib/crm-queries";
import InviteGenerator from "@/components/crm/InviteGenerator";
import { Shield, Users } from "lucide-react";

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

function defaultRange() {
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return {
    from: from.toISOString().split("T")[0],
    to:   to.toISOString().split("T")[0],
  };
}

export default async function CRMManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string; from?: string; to?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [role, userTeam] = await Promise.all([
    getUserTeamRole(user.id),
    getUserTeam(user.id),
  ]);

  if (role !== "admin" || !userTeam) redirect("/dashboard/crm");

  const params     = await searchParams;
  const defaults   = defaultRange();
  const fromDate   = params.from   || defaults.from;
  const toDate     = params.to     || defaults.to;
  const memberFilter = params.member || "";

  const [submissions, members, tokens] = await Promise.all([
    getCRMSubmissions(userTeam.teamId, {
      from:     fromDate,
      to:       toDate,
      memberId: memberFilter || undefined,
    }),
    getCRMTeamMembers(userTeam.teamId),
    getManagerInviteTokens(user.id),
  ]);

  const totalDeal = submissions.reduce((sum, s) => sum + Number(s.deal_value ?? 0), 0);
  const wonCount  = submissions.filter(s => s.outcome === "won").length;

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-[1100px] space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-violet-400/80 uppercase tracking-widest">Manager View</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight">{userTeam.team.name}</h1>
        <p className="text-sm text-[#6b7280] mt-0.5">
          {members.length} member{members.length !== 1 ? "s" : ""} · CRM submissions dashboard
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Submissions",   value: submissions.length.toString()              },
          { label: "Won",           value: wonCount.toString()                        },
          { label: "Total Deal £",  value: `£${totalDeal.toLocaleString()}`           },
          { label: "Win Rate",      value: submissions.length > 0 ? `${Math.round((wonCount / submissions.length) * 100)}%` : "—" },
        ].map(card => (
          <div key={card.label} className="bg-[#111318] border border-[#1e2130] rounded-xl px-4 py-3">
            <p className="text-[11px] text-[#4b5563] uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-lg font-bold text-[#f0f2f8]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Invite generator */}
      <InviteGenerator existingTokens={tokens} />

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-end gap-3 bg-[#111318] border border-[#1e2130] rounded-2xl p-4">
        <div>
          <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Member</label>
          <select
            name="member"
            defaultValue={memberFilter}
            className="bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All members</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>
                {m.profiles?.full_name || m.profiles?.email || m.user_id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">From</label>
          <input
            name="from"
            type="date"
            defaultValue={fromDate}
            className="bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">To</label>
          <input
            name="to"
            type="date"
            defaultValue={toDate}
            className="bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-sm font-semibold transition-colors"
        >
          Filter
        </button>
        <a
          href="/dashboard/crm/manager"
          className="px-4 py-2 rounded-lg text-[#6b7280] hover:text-[#9ca3af] text-sm transition-colors"
        >
          Reset
        </a>
      </form>

      {/* Submissions table */}
      {submissions.length === 0 ? (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center">
          <Users className="w-8 h-8 text-[#374151] mx-auto mb-3" />
          <p className="text-sm text-[#6b7280]">No submissions for this period.</p>
        </div>
      ) : (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2130]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Member</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider hidden sm:table-cell">Outcome</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider hidden sm:table-cell">Deal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2130]">
              {submissions.map((s) => {
                const profile = s.profiles as { full_name?: string; email?: string } | null;
                const memberName = profile?.full_name || profile?.email || "—";
                return (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-[#6b7280] text-xs whitespace-nowrap">{s.submission_date}</td>
                    <td className="px-4 py-3 text-[#9ca3af] text-xs">{memberName}</td>
                    <td className="px-4 py-3 text-[#f0f2f8] font-medium max-w-[180px] truncate">{s.contact_name}</td>
                    <td className="px-4 py-3 text-[#6b7280] hidden md:table-cell">{s.company ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOURS[s.status] ?? ""}`}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-semibold capitalize ${OUTCOME_COLOURS[s.outcome] ?? ""}`}>
                        {s.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#9ca3af] text-xs hidden sm:table-cell">
                      {s.deal_value != null ? `£${Number(s.deal_value).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
