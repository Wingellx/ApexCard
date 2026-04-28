import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getProfileFull,
  getOwnerVerificationRequest,
  getDiscoverableReps,
  getOwnerShortlist,
  getAllTeamsForOwner,
  getPendingTeamApplications,
  type DiscoverableRep,
  type OwnerTeamRow,
  type PendingTeamApplication,
} from "@/lib/queries";
import ShortlistButton from "./ShortlistButton";
import ProcessTiersButton from "./ProcessTiersButton";
import PostOfferForm from "./PostOfferForm";
import { getPendingOwnerVerificationRequests } from "@/lib/verification-queries";
import OwnerVerificationPanel from "@/components/verification/OwnerVerificationPanel";
import { signout } from "@/app/auth/actions";
import { approveTeamById, declineTeamById, setPreviewRole, enterSBOAdminMode } from "./actions";
import { PREVIEW_ROLES } from "@/lib/preview";
import {
  Clock, Search, ExternalLink, ShieldCheck, Mail,
  Star, Users, Briefcase, BarChart3, Shield, ChevronRight,
  CheckCircle2, XCircle, CalendarDays, User, Eye, LayoutGrid,
} from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const ROLE_LABELS: Record<string, string> = {
  closer: "Closer", setter: "Setter", operator: "Operator",
  manager: "Manager", sales_manager: "Sales Manager",
};

// ── Sign-out form ─────────────────────────────────────────────

function SignOutForm({ className }: { className?: string }) {
  return (
    <form action={signout}>
      <button type="submit" className={className ?? "text-xs text-[#374151] hover:text-[#6b7280] transition-colors font-medium"}>
        Sign out
      </button>
    </form>
  );
}

// ── Pending page ─────────────────────────────────────────────

function PendingPage({ companyName, email }: { companyName: string | null; email: string }) {
  return (
    <div className="min-h-screen bg-[#080a0e] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/[0.06] rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md text-center">
        <Link href="/" className="flex items-center justify-center gap-2 mb-10">
          <img src="/logo.svg" alt="ApexCard" className="w-6 h-6 opacity-40" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20">ApexCard</span>
        </Link>

        <div className="bg-[#0f1117] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="h-[2px] bg-indigo-500 shadow-[0_2px_14px_2px_rgba(99,102,241,0.35)]" />
          <div className="p-8">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Clock className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-xl font-extrabold text-[#f0f2f8] tracking-tight mb-2">
              Pending Verification
            </h1>
            {companyName && (
              <p className="text-sm font-semibold text-indigo-400 mb-3">{companyName}</p>
            )}
            <p className="text-sm text-[#6b7280] leading-relaxed mb-4">
              Your application is under review. We manually verify all Offer Owner accounts — this typically takes 1–2 business days.
            </p>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 mb-6">
              <p className="text-[11px] text-[#4b5563] uppercase tracking-widest mb-1">We&apos;ll email you at</p>
              <p className="text-sm font-semibold text-[#d1d5db]">{email}</p>
            </div>
            <p className="text-xs text-[#374151]">
              Questions? Email us at{" "}
              <a href="mailto:support@apexcard.co" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                support@apexcard.co
              </a>
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SignOutForm className="text-sm text-[#374151] hover:text-[#6b7280] transition-colors" />
        </div>
      </div>
    </div>
  );
}

// ── Rep card ─────────────────────────────────────────────────

function RepCard({ rep, isShortlisted }: { rep: DiscoverableRep; isShortlisted: boolean }) {
  const initials = rep.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl p-5 hover:bg-[#111520] transition-colors flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-violet-300">{initials}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-[#f0f2f8] truncate">{rep.name}</span>
              {rep.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {rep.username && <span className="text-[11px] text-[#4b5563]">@{rep.username}</span>}
              {rep.role && (
                <span className="text-[10px] font-semibold text-[#374151] bg-[#1a1d28] border border-[#1e2130] px-1.5 py-0.5 rounded-full">
                  {ROLE_LABELS[rep.role] ?? rep.role}
                </span>
              )}
            </div>
          </div>
        </div>
        <ShortlistButton repId={rep.id} isShortlisted={isShortlisted} />
      </div>

      {rep.teamName && (
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-indigo-400/60 shrink-0" />
          <span className="text-[11px] text-indigo-400/80 font-medium truncate">{rep.teamName}</span>
        </div>
      )}

      {rep.bio && <p className="text-xs text-[#6b7280] leading-relaxed line-clamp-2">{rep.bio}</p>}

      <div className="grid grid-cols-3 gap-3 bg-white/[0.02] rounded-xl p-3">
        <div className="text-center">
          <p className="text-xs font-extrabold text-emerald-400 tabular-nums">{fmt(rep.totalCash)}</p>
          <p className="text-[10px] text-[#374151] mt-0.5">Cash</p>
        </div>
        <div className="text-center border-x border-white/[0.04]">
          <p className="text-xs font-extrabold text-indigo-400 tabular-nums">{rep.closeRate.toFixed(1)}%</p>
          <p className="text-[10px] text-[#374151] mt-0.5">Close Rate</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-extrabold text-[#9ca3af] tabular-nums">{rep.daysLogged}</p>
          <p className="text-[10px] text-[#374151] mt-0.5">Days</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {rep.username ? (
          <Link
            href={`/card/${rep.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#9ca3af] hover:text-indigo-400 bg-white/[0.03] hover:bg-indigo-500/[0.06] border border-white/[0.06] hover:border-indigo-500/20 px-3 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View ApexCard
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {rep.contactEnabled && (
          <a
            href={`mailto:?subject=ApexCard — ${encodeURIComponent(rep.name)}`}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#9ca3af] hover:text-emerald-400 bg-white/[0.03] hover:bg-emerald-500/[0.06] border border-white/[0.06] hover:border-emerald-500/20 px-3 py-2 rounded-lg transition-colors"
          >
            <Mail className="w-3.5 h-3.5" /> Contact
          </a>
        )}
      </div>
    </div>
  );
}

// ── Team card ─────────────────────────────────────────────────

const TIER_LABELS: Record<number, string> = { 1: "Tier 1", 2: "Tier 2", 3: "Tier 3" };
const DIVISION_LABELS: Record<string, string> = {
  sales: "Sales", improvement: "Improvement", mixed: "Mixed",
};
const STATUS_STYLES: Record<string, string> = {
  pending:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
  declined:  "text-rose-400  bg-rose-500/10  border-rose-500/20",
  suspended: "text-rose-400  bg-rose-500/10  border-rose-500/20",
};

function TeamCard({ team }: { team: OwnerTeamRow }) {
  return (
    <Link
      href={`/owner/team/${team.id}`}
      className="group bg-[#0f1117] border border-[#1e2130] hover:border-indigo-500/30 rounded-2xl p-5 flex flex-col gap-3 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#f0f2f8] truncate group-hover:text-indigo-300 transition-colors">{team.name}</p>
            <p className="text-[11px] text-[#4b5563] mt-0.5">
              {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
              {team.subTeamCount > 0 && ` · ${team.subTeamCount} sub-team${team.subTeamCount !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {team.status && team.status !== "active" && (
            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[team.status] ?? "text-[#6b7280] bg-white/5 border-white/10"}`}>
              {team.status}
            </span>
          )}
          {team.tier && (
            <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
              {TIER_LABELS[team.tier] ?? `Tier ${team.tier}`}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-[#374151] group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
      {team.description && (
        <p className="text-xs text-[#6b7280] leading-relaxed line-clamp-2">{team.description}</p>
      )}
      {team.division && (
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-[#4b5563]" />
          <span className="text-[11px] text-[#4b5563]">{DIVISION_LABELS[team.division] ?? team.division} division</span>
        </div>
      )}
    </Link>
  );
}

// ── Pending application card ──────────────────────────────────

function PendingApplicationCard({ app }: { app: PendingTeamApplication }) {
  const daysAgo = Math.floor((Date.now() - new Date(app.createdAt).getTime()) / 86_400_000);

  async function approve() {
    "use server";
    await approveTeamById(app.id);
  }

  async function decline() {
    "use server";
    await declineTeamById(app.id);
  }

  return (
    <div className="bg-[#0f1117] border border-amber-500/20 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#f0f2f8] truncate">{app.name}</p>
            {app.parentName && (
              <p className="text-[11px] text-[#4b5563] mt-0.5">Sub-team of {app.parentName}</p>
            )}
          </div>
        </div>
        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
          Pending
        </span>
      </div>

      <div className="flex items-center gap-4 text-[11px] text-[#4b5563]">
        {app.managerName && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />{app.managerName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3" />
          {daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`}
        </span>
      </div>

      <div className="flex gap-2">
        <form action={approve} className="flex-1">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
          </button>
        </form>
        <form action={decline} className="flex-1">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" /> Decline
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Preview As section ────────────────────────────────────────

function PreviewAsSection() {
  async function enterPreview(formData: FormData) {
    "use server";
    await setPreviewRole(formData.get("role") as string);
  }

  return (
    <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-3.5 h-3.5 text-indigo-400" />
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Preview As Rep</p>
      </div>
      <p className="text-xs text-[#4b5563] mb-4 leading-relaxed">
        Temporarily preview the dashboard as a specific rep role. Session-only — nothing changes in the database.
      </p>
      <form action={enterPreview} className="flex flex-wrap gap-2">
        {PREVIEW_ROLES.map((r) => (
          <button
            key={r.value}
            type="submit"
            name="role"
            value={r.value}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 hover:border-indigo-400/40 transition-colors"
          >
            {r.label}
          </button>
        ))}
      </form>
    </div>
  );
}

// ── SetByOffers Admin demo section ────────────────────────────

function SBOAdminSection() {
  return (
    <div className="bg-[#0f1117] border border-cyan-500/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">SetByOffers Demo</p>
      </div>
      <p className="text-xs text-[#4b5563] mb-4 leading-relaxed">
        View the offer board as Arun (SetByOffers admin) with full access to post new offers. Session-only — no database changes.
      </p>
      <form action={enterSBOAdminMode}>
        <button
          type="submit"
          className="text-xs font-semibold px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40 transition-colors flex items-center gap-2"
        >
          <Briefcase className="w-3.5 h-3.5" />
          View as SetByOffers Admin
        </button>
      </form>
    </div>
  );
}

// ── Full portal ───────────────────────────────────────────────

function FullPortal({
  reps,
  shortlist,
  query,
  teams,
  pending,
  verificationRequests,
}: {
  reps:                   DiscoverableRep[];
  shortlist:              Set<string>;
  query:                  string;
  teams:                  OwnerTeamRow[];
  pending:                PendingTeamApplication[];
  verificationRequests:   import("@/lib/verification-queries").RepVerificationRequestWithRep[];
}) {
  const shortlisted = reps.filter((r) => shortlist.has(r.id));

  return (
    <div className="min-h-screen bg-[#080a0e]">
      {/* Header */}
      <div className="border-b border-white/[0.04] bg-[#0b0d12]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#f0f2f8] tracking-tight leading-none">Owner Portal</h1>
              <p className="text-[11px] text-[#4b5563] mt-0.5">{reps.length} rep{reps.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/offers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Offer Board
            </Link>
            <SignOutForm />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">

        {/* Pending team applications */}
        {pending.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">
                Pending Applications ({pending.length})
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((app) => <PendingApplicationCard key={app.id} app={app} />)}
            </div>
            <div className="border-t border-white/[0.04] mt-8" />
          </div>
        )}

        {/* Preview As */}
        <PreviewAsSection />

        {/* SetByOffers Admin Demo */}
        <SBOAdminSection />

        {/* Search */}
        <form method="GET" className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#374151] pointer-events-none" />
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by name or @username…"
            className="w-full bg-[#0f1117] border border-[#1e2130] rounded-xl pl-11 pr-4 py-3 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-colors max-w-md"
          />
        </form>

        {/* Shortlist section */}
        {shortlisted.length > 0 && !query && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">
                Shortlisted ({shortlisted.length})
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shortlisted.map((rep) => <RepCard key={rep.id} rep={rep} isShortlisted />)}
            </div>
            <div className="border-t border-white/[0.04] mt-8" />
          </div>
        )}

        {/* Teams section */}
        {!query && teams.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-3.5 h-3.5 text-[#4b5563]" />
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">
                Teams ({teams.length})
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((t) => <TeamCard key={t.id} team={t} />)}
            </div>
            <div className="border-t border-white/[0.04] mt-8" />
          </div>
        )}

        {/* Admin tools */}
        <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">Community Rankings</p>
          </div>
          <p className="text-xs text-[#4b5563] mb-4">
            Run at month-end to promote/demote communities based on their division standings. Top 2 in each tier move up; bottom 2 move down.
          </p>
          <ProcessTiersButton />
        </div>

        {/* Rep verification requests */}
        {verificationRequests.length > 0 && (
          <OwnerVerificationPanel requests={verificationRequests} />
        )}

        {/* SetByOffers — Post an Offer */}
        <PostOfferForm />

        {/* All reps */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-3.5 h-3.5 text-[#4b5563]" />
            <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">
              {query ? `Results for "${query}" (${reps.length})` : `All Reps (${reps.length})`}
            </p>
          </div>

          {reps.length === 0 ? (
            <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl py-16 text-center">
              <Search className="w-10 h-10 text-[#1e2130] mx-auto mb-4" />
              <p className="text-sm font-semibold text-[#374151]">
                {query ? `No reps match "${query}"` : "No reps yet"}
              </p>
              {!query && (
                <p className="text-xs text-[#2d3147] mt-1">
                  Reps appear here when they enable discoverability in their profile settings.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reps.map((rep) => (
                <RepCard key={rep.id} rep={rep} isShortlisted={shortlist.has(rep.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default async function OwnerPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const profile = await getProfileFull(user.id);

  if (!profile || profile.account_type !== "owner") redirect("/dashboard");

  if (!profile.verified_owner) {
    const request = await getOwnerVerificationRequest(user.id);
    return (
      <PendingPage
        companyName={request?.company_name ?? null}
        email={profile.email ?? user.email ?? ""}
      />
    );
  }

  const sp    = await searchParams;
  const query = sp.q?.trim() ?? "";

  const [reps, shortlist, teams, pending, verificationRequests] = await Promise.all([
    getDiscoverableReps(query || undefined),
    getOwnerShortlist(user.id),
    getAllTeamsForOwner(),
    getPendingTeamApplications(),
    getPendingOwnerVerificationRequests(),
  ]);

  return (
    <FullPortal reps={reps} shortlist={shortlist} query={query} teams={teams} pending={pending} verificationRequests={verificationRequests} />
  );
}
