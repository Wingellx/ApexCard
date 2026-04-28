import Link from "next/link";
import { Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTeamByInviteCode, getUserTeam } from "@/lib/queries";
import { IO_TEAM_ID } from "@/lib/io-score";
import JoinButton from "./JoinButton";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;

  const team = await getTeamByInviteCode(inviteCode);

  if (!team) {
    return (
      <div className="min-h-screen bg-[#080a0e] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#111318] border border-[#1e2130] flex items-center justify-center">
            <Users className="w-7 h-7 text-[#374151]" />
          </div>
          <p className="text-base font-bold text-[#f0f2f8] mb-2">Invite link not found</p>
          <p className="text-sm text-[#6b7280]">This link may have expired or been revoked by the team admin.</p>
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  type Status = "guest" | "already_member" | "other_team" | "not_member";
  let status: Status = "guest";

  if (user) {
    const existing = await getUserTeam(user.id);
    if (existing?.teamId === team.id)  status = "already_member";
    else if (existing)                 status = "other_team";
    else                               status = "not_member";
  }

  const isIO = team.id === IO_TEAM_ID;

  return (
    <div className="min-h-screen bg-[#080a0e] flex flex-col items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-3xl ${isIO ? "bg-white/[0.03]" : "bg-indigo-600/[0.06]"}`} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Wordmark */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="ApexCard" className="w-6 h-6 opacity-40" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">ApexCard</span>
          </Link>
        </div>

        <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className={`h-[2px] ${isIO ? "bg-white shadow-[0_2px_14px_2px_rgba(255,255,255,0.15)]" : "bg-indigo-500 shadow-[0_2px_14px_2px_rgba(99,102,241,0.35)]"}`} />
          <div className="p-8 text-center">

            {/* Team avatar */}
            {team.logo_url ? (
              <img
                src={team.logo_url}
                alt={team.name}
                className="w-16 h-16 rounded-2xl mx-auto mb-5 object-cover border border-white/[0.08]"
              />
            ) : (
              <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center ${isIO ? "bg-white/5 border border-white/10 text-2xl" : "bg-indigo-500/10 border border-indigo-500/20"}`}>
                {isIO ? "⚔️" : <Users className="w-7 h-7 text-indigo-400" />}
              </div>
            )}

            <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-2">
              {isIO ? "You've been called to join" : "You've been invited to join"}
            </p>
            <h1 className="text-2xl font-extrabold text-[#f0f2f8] tracking-tight mb-2">
              {isIO ? "Join the Brotherhood ⚔️" : team.name}
            </h1>

            {isIO ? (
              <p className="text-sm text-[#6b7280] leading-relaxed mb-4 max-w-xs mx-auto">
                A global brotherhood of men who execute daily. Built on accountability, fitness, and relentless improvement.
              </p>
            ) : team.description ? (
              <p className="text-sm text-[#6b7280] leading-relaxed mb-4 max-w-xs mx-auto">
                {team.description}
              </p>
            ) : null}

            <div className="inline-flex items-center gap-1.5 text-xs text-[#4b5563] mb-8">
              <Users className="w-3.5 h-3.5" />
              <span>
                {team.memberCount} {isIO ? `brother${team.memberCount !== 1 ? "s" : ""}` : `member${team.memberCount !== 1 ? "s" : ""}`}
              </span>
            </div>

            {/* CTA based on auth/membership status */}
            {status === "already_member" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  {isIO ? "You're already in the Brotherhood" : "You're already on this team"}
                </div>
                <Link
                  href={isIO ? "/dashboard/io" : "/dashboard/team"}
                  className={`inline-flex items-center justify-center gap-2 w-full text-sm font-semibold px-6 py-3 rounded-xl transition-colors ${isIO ? "bg-white hover:bg-white/90 text-black" : "bg-indigo-500 hover:bg-indigo-400 text-white"}`}
                >
                  {isIO ? "Go to IO Dashboard" : "View team dashboard"} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {status === "other_team" && (
              <div className="space-y-3">
                <p className="text-sm text-[#6b7280] leading-relaxed">
                  You&apos;re already a member of another team. Leave your current team to join this one.
                </p>
                <Link
                  href="/dashboard/team"
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View your current team →
                </Link>
              </div>
            )}

            {status === "not_member" && (
              <JoinButton inviteCode={inviteCode} teamName={isIO ? "the Brotherhood" : team.name} isIO={isIO} />
            )}

            {status === "guest" && (
              <div className="space-y-3">
                <p className="text-sm text-[#6b7280] mb-2">
                  {isIO ? "Sign in to your ApexCard account to enter the Brotherhood." : "Sign in to your ApexCard account to join."}
                </p>
                <Link
                  href={`/auth/login?next=/join/${inviteCode}`}
                  className={`inline-flex items-center justify-center gap-2 w-full text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg ${isIO ? "bg-white hover:bg-white/90 text-black shadow-white/10" : "bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20"}`}
                >
                  {isIO ? "Sign in to join the Brotherhood" : "Sign in to join"} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={isIO ? `/auth/signup?next=/join/${inviteCode}` : `/join/${inviteCode}/signup`}
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
