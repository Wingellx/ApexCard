import Link from "next/link";
import { Users, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserTeam } from "@/lib/queries";
import { getInviteTokenInfo } from "@/lib/crm-queries";
import JoinCRMButton from "./JoinCRMButton";

export default async function JoinCRMPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteTokenInfo(token);

  if (!invite) {
    return <InvalidState reason="This invite link is invalid or doesn't exist." />;
  }

  const expired = new Date(invite.expires_at) < new Date();
  const used    = !!invite.used_at;

  if (expired && !used) {
    return <InvalidState reason="This invite link has expired. Ask your manager to generate a new one." />;
  }
  if (used) {
    return <InvalidState reason="This invite link has already been used." />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  type Status = "guest" | "already_member" | "other_team" | "ready";
  let status: Status = "guest";

  if (user) {
    const existing = await getUserTeam(user.id);
    if (existing?.teamId === invite.team_id) status = "already_member";
    else if (existing)                        status = "other_team";
    else                                      status = "ready";
  }

  const teamName    = invite.teams?.name ?? "a team";
  const managerName = invite.creator?.full_name ?? "your manager";

  const expiresIn = Math.max(
    0,
    Math.round((new Date(invite.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))
  );

  return (
    <div className="min-h-screen bg-[#080a0e] flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/[0.06] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-10">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="ApexCard" className="w-6 h-6 opacity-40" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">ApexCard</span>
          </Link>
        </div>

        <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="h-[2px] bg-indigo-500 shadow-[0_2px_14px_2px_rgba(99,102,241,0.35)]" />
          <div className="p-8 text-center">

            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Users className="w-7 h-7 text-indigo-400" />
            </div>

            <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">
              {managerName} invited you to join
            </p>
            <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight mb-4">
              {teamName}
            </h1>

            <div className="inline-flex items-center gap-1.5 text-xs text-[#4b5563] mb-8">
              <Clock className="w-3.5 h-3.5" />
              <span>Expires in {expiresIn}h</span>
            </div>

            {status === "already_member" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  You&apos;re already on this team
                </div>
                <Link
                  href="/dashboard/crm"
                  className="inline-flex items-center justify-center gap-2 w-full text-sm font-semibold px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white transition-colors"
                >
                  Go to CRM <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {status === "other_team" && (
              <div className="space-y-3">
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  You&apos;re already a member of another team. Leave your current team before accepting this invite.
                </p>
                <Link
                  href="/dashboard/team"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View your current team →
                </Link>
              </div>
            )}

            {status === "ready" && (
              <JoinCRMButton token={token} />
            )}

            {status === "guest" && (
              <div className="space-y-3">
                <p className="text-sm text-[#6b7280] mb-2">
                  Sign in to your ApexCard account to accept this invite.
                </p>
                <Link
                  href={`/auth/login?next=/join/crm/${token}`}
                  className="inline-flex items-center justify-center gap-2 w-full text-sm font-semibold px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white transition-colors shadow-lg shadow-indigo-500/20"
                >
                  Sign in to join <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/auth/signup?next=/join/crm/${token}`}
                  className="inline-flex items-center justify-center gap-2 w-full text-sm text-[#4b5563] hover:text-[#9ca3af] transition-colors py-1"
                >
                  Don&apos;t have an account? Sign up →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvalidState({ reason }: { reason: string }) {
  return (
    <div className="min-h-screen bg-[#080a0e] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#111318] border border-[#1e2130] flex items-center justify-center">
          <XCircle className="w-7 h-7 text-[#374151]" />
        </div>
        <p className="text-base font-bold text-[#f0f2f8] mb-2">Invite unavailable</p>
        <p className="text-sm text-[#6b7280]">{reason}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
        >
          Back to ApexCard →
        </Link>
      </div>
    </div>
  );
}
