import Link from "next/link";
import { Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import TeamSignupForm from "./TeamSignupForm";

export default async function TeamSignupPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;

  const admin = createAdminClient();
  const { data: allTeams } = await admin.from("teams").select("id, name, invite_code");
  const team = (allTeams ?? []).find(
    t => (t.invite_code as string).trim() === inviteCode.trim()
  );

  if (!team) {
    return (
      <div className="min-h-screen bg-[#080a0e] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#111318] border border-[#1e2130] flex items-center justify-center">
            <Users className="w-7 h-7 text-[#374151]" />
          </div>
          <p className="text-base font-bold text-[#f0f2f8] mb-2">Invite link not found</p>
          <p className="text-sm text-[#6b7280]">This link may have expired or been revoked.</p>
          <Link href="/" className="inline-flex items-center gap-2 mt-6 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            Back to ApexCard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/[0.06] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-2 mb-10">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="ApexCard" className="w-6 h-6 opacity-40" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">ApexCard</span>
          </Link>
        </div>

        <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="h-[2px] bg-indigo-500 shadow-[0_2px_14px_2px_rgba(99,102,241,0.35)]" />
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/[0.06]">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest">You&apos;re joining</p>
                <p className="text-base font-extrabold text-[#f0f2f8] tracking-tight truncate">{team.name as string}</p>
              </div>
            </div>

            <h1 className="text-xl font-extrabold text-[#f0f2f8] tracking-tight mb-1">Create your account</h1>
            <p className="text-sm text-[#6b7280] mb-7">
              You&apos;ll be added to the team as soon as you sign up.
            </p>

            <TeamSignupForm inviteCode={inviteCode} teamName={team.name as string} />

            <p className="text-center text-xs text-[#374151] mt-6">
              Already have an account?{" "}
              <Link
                href={`/auth/login?next=/join/${inviteCode}`}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
