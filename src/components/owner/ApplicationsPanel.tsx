"use client";

import { useState, useTransition, useMemo } from "react";
import { ShieldCheck, ChevronDown, ChevronUp, Loader2, CheckCircle2, Eye, X, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateApplicationStatus } from "@/app/offers/application-actions";
import type { OwnerApplication, ApplicationStatus } from "@/lib/offers-queries";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; cls: string }> = {
  submitted: { label: "Submitted", cls: "text-[#6b7280] bg-white/[0.04] border-[#1e2130]"            },
  viewed:    { label: "Viewed",    cls: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"       },
  accepted:  { label: "Accepted",  cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"    },
  declined:  { label: "Declined",  cls: "text-rose-400 bg-rose-500/10 border-rose-500/20"             },
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function daysUntil(isoDate: string) {
  return Math.max(0, Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000));
}

function ApplicationRow({ app, onStatusChange }: {
  app: OwnerApplication;
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState<ApplicationStatus>(app.status);

  function changeStatus(status: ApplicationStatus) {
    setLocalStatus(status);
    startTransition(async () => {
      await onStatusChange(app.id, status);
    });
  }

  return (
    <div className="border border-[#1e2130] rounded-xl overflow-hidden">
      {/* Row header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#0f1117] hover:bg-[#111520] transition-colors text-left"
      >
        <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-2 items-start sm:grid-cols-[1fr_1fr_auto]">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#f0f2f8] truncate">{app.rep_name}</p>
            <p className="text-[11px] text-[#4b5563] mt-0.5 truncate">
              {app.rep_username ? `@${app.rep_username}` : app.rep_email}
              {app.rep_is_verified && app.rep_verification_active && (
                <span className="inline-flex items-center gap-0.5 ml-1.5 text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </p>
          </div>
          <div className="hidden sm:block text-[11px] text-[#4b5563]">
            <p className="font-semibold text-[#6b7280] truncate">{app.offer_title}</p>
            <p>{new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
          </div>
          <StatusBadge status={localStatus} />
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#374151] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#374151] shrink-0" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="bg-[#080a0e] border-t border-[#1e2130] p-4 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0f1117] border border-[#1e2130] rounded-xl px-3 py-3 text-center">
              <p className="text-sm font-extrabold text-emerald-400 tabular-nums">{fmt(app.rep_lifetime_cash)}</p>
              <p className="text-[10px] text-[#374151] mt-0.5">Cash Collected</p>
            </div>
            <div className="bg-[#0f1117] border border-[#1e2130] rounded-xl px-3 py-3 text-center">
              <p className="text-sm font-extrabold text-indigo-400 tabular-nums">{app.rep_close_rate.toFixed(1)}%</p>
              <p className="text-[10px] text-[#374151] mt-0.5">Close Rate</p>
            </div>
            <div className="bg-[#0f1117] border border-[#1e2130] rounded-xl px-3 py-3 text-center">
              <p className="text-sm font-extrabold text-[#9ca3af] tabular-nums">{app.rep_days_logged}</p>
              <p className="text-[10px] text-[#374151] mt-0.5">Days Logged</p>
            </div>
          </div>

          {/* Cover note */}
          {app.cover_note && (
            <div className="bg-[#0f1117] border-l-2 border-indigo-500/40 pl-3 py-2 rounded-r-xl">
              <p className="text-[10px] font-bold text-[#4b5563] uppercase tracking-widest mb-1.5">Cover Note</p>
              <p className="text-sm text-[#9ca3af] leading-relaxed">{app.cover_note}</p>
            </div>
          )}

          {/* Expires */}
          <p className="text-[11px] text-[#374151]">
            Expires in {daysUntil(app.expires_at)} days · {app.rep_email}
          </p>

          {/* View rep card link */}
          {app.rep_username && (
            <a
              href={`/card/${app.rep_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4b5563] hover:text-indigo-400 transition-colors"
            >
              View ApexCard →
            </a>
          )}

          {/* Status actions */}
          <div className="flex items-center gap-2 pt-1">
            <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest shrink-0">Update status:</p>
            <div className="flex items-center gap-2 flex-wrap">
              {(["viewed", "accepted", "declined"] as ApplicationStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={isPending || localStatus === s}
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-40",
                    localStatus === s
                      ? STATUS_CONFIG[s].cls
                      : "text-[#4b5563] bg-white/[0.02] border-[#1e2130] hover:bg-white/[0.05]"
                  )}
                >
                  {isPending && localStatus !== s ? null : (
                    s === "viewed"   ? <Eye className="w-3 h-3" />            :
                    s === "accepted" ? <CheckCircle2 className="w-3 h-3" />   :
                                       <X className="w-3 h-3" />
                  )}
                  {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPanel({ applications }: { applications: OwnerApplication[] }) {
  const [offerFilter, setOfferFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [localApps, setLocalApps] = useState<OwnerApplication[]>(applications);

  const uniqueOffers = useMemo(() => {
    const seen = new Map<string, string>();
    for (const a of applications) {
      if (!seen.has(a.offer_id)) seen.set(a.offer_id, a.offer_title);
    }
    return [...seen.entries()].map(([id, title]) => ({ id, title }));
  }, [applications]);

  const filtered = useMemo(() => localApps.filter(a => {
    if (offerFilter !== "all" && a.offer_id !== offerFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  }), [localApps, offerFilter, statusFilter]);

  async function handleStatusChange(appId: string, status: ApplicationStatus) {
    await updateApplicationStatus(appId, status);
    setLocalApps(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
  }

  if (applications.length === 0) return null;

  return (
    <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#1e2130] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
          <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">
            Applications ({applications.length})
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Offer filter */}
          <select
            value={offerFilter}
            onChange={e => setOfferFilter(e.target.value)}
            className="bg-[#0a0c12] border border-[#1e2130] rounded-lg px-3 py-1.5 text-xs text-[#9ca3af] focus:outline-none focus:border-indigo-500/40"
          >
            <option value="all">All offers</option>
            {uniqueOffers.map(o => (
              <option key={o.id} value={o.id}>{o.title}</option>
            ))}
          </select>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ApplicationStatus | "all")}
            className="bg-[#0a0c12] border border-[#1e2130] rounded-lg px-3 py-1.5 text-xs text-[#9ca3af] focus:outline-none focus:border-indigo-500/40"
          >
            <option value="all">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="viewed">Viewed</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Application list */}
      <div className="p-5 space-y-2.5">
        {filtered.length === 0 ? (
          <p className="text-sm text-[#374151] text-center py-8">No applications match this filter.</p>
        ) : (
          filtered.map(app => (
            <ApplicationRow key={app.id} app={app} onStatusChange={handleStatusChange} />
          ))
        )}
      </div>
    </div>
  );
}
