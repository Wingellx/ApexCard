"use client";

import { useState, useTransition, useMemo } from "react";
import { ShieldCheck, ChevronDown, ChevronUp, Loader2, CheckCircle2, Eye, X, DollarSign, Calendar, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateApplicationStatus, closeOffer } from "@/app/offers/application-actions";
import type { OwnerApplication, ApplicationStatus } from "@/lib/offers-queries";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; cls: string }> = {
  submitted: { label: "Submitted", cls: "text-[#6b7280] bg-white/[0.04] border-[#1e2130]"              },
  viewed:    { label: "Viewed",    cls: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"         },
  interview: { label: "Interview", cls: "text-amber-400 bg-amber-500/10 border-amber-500/20"            },
  accepted:  { label: "Accepted",  cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"      },
  declined:  { label: "Declined",  cls: "text-rose-400 bg-rose-500/10 border-rose-500/20"               },
};

const STATUS_ACTIONS: { status: ApplicationStatus; icon: React.ReactNode; label: string }[] = [
  { status: "viewed",    icon: <Eye className="w-3 h-3" />,          label: "Viewed"     },
  { status: "interview", icon: <Calendar className="w-3 h-3" />,     label: "Interview"  },
  { status: "accepted",  icon: <CheckCircle2 className="w-3 h-3" />, label: "Accepted"   },
  { status: "declined",  icon: <X className="w-3 h-3" />,            label: "Declined"   },
];

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap", cfg.cls)}>
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
  const [expanded, setExpanded]           = useState(false);
  const [isPending, startTransition]      = useTransition();
  const [localStatus, setLocalStatus]     = useState<ApplicationStatus>(app.status);

  function changeStatus(status: ApplicationStatus) {
    setLocalStatus(status);
    startTransition(async () => { await onStatusChange(app.id, status); });
  }

  return (
    <div className="border border-[#1e2130] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#0f1117] hover:bg-[#111520] transition-colors text-left"
      >
        <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-2 items-center sm:grid-cols-[1fr_auto_auto]">
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
          <span className="hidden sm:block text-[11px] text-[#374151]">
            {new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <StatusBadge status={localStatus} />
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#374151] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#374151] shrink-0" />}
      </button>

      {expanded && (
        <div className="bg-[#080a0e] border-t border-[#1e2130] p-4 space-y-4">
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

          <p className="text-[11px] text-[#374151]">
            Expires in {daysUntil(app.expires_at)} day{daysUntil(app.expires_at) !== 1 ? "s" : ""} · {app.rep_email}
          </p>

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

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <p className="text-[10px] font-bold text-[#374151] uppercase tracking-widest shrink-0">Move to:</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_ACTIONS.map(({ status: s, icon, label }) => (
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
                  {isPending && localStatus !== s ? icon : isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Per-offer group with Close Offer button ───────────────────────────────────

function OfferGroup({
  offerId,
  offerTitle,
  offerCompany,
  apps,
  onStatusChange,
}: {
  offerId:       string;
  offerTitle:    string;
  offerCompany:  string;
  apps:          OwnerApplication[];
  onStatusChange:(id: string, status: ApplicationStatus) => Promise<void>;
}) {
  const [closing, startClose]         = useTransition();
  const [isClosed, setIsClosed]       = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  async function handleClose() {
    startClose(async () => {
      const result = await closeOffer(offerId);
      if (!result.error) setIsClosed(true);
      setConfirmClose(false);
    });
  }

  return (
    <div className="space-y-2">
      {/* Offer header */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#9ca3af] truncate">{offerTitle}</p>
          <p className="text-[10px] text-[#374151]">{offerCompany} · {apps.length} application{apps.length !== 1 ? "s" : ""}</p>
        </div>
        {isClosed ? (
          <span className="text-[10px] font-bold text-[#4b5563] bg-white/[0.02] border border-[#1e2130] px-2 py-1 rounded-lg">
            Closed
          </span>
        ) : confirmClose ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-[#6b7280]">Close this offer?</span>
            <button
              onClick={handleClose}
              disabled={closing}
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors disabled:opacity-50"
            >
              {closing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              Confirm
            </button>
            <button
              onClick={() => setConfirmClose(false)}
              className="text-[11px] text-[#374151] hover:text-[#6b7280] transition-colors px-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClose(true)}
            className="shrink-0 text-[11px] font-bold text-[#4b5563] hover:text-rose-400 border border-[#1e2130] hover:border-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Close Offer
          </button>
        )}
      </div>

      {/* Applications for this offer */}
      <div className="space-y-1.5 pl-0">
        {apps.map(app => (
          <ApplicationRow key={app.id} app={app} onStatusChange={onStatusChange} />
        ))}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function ApplicationsPanel({ applications }: { applications: OwnerApplication[] }) {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [localApps, setLocalApps]       = useState<OwnerApplication[]>(applications);

  // Group by offer, preserving first-seen order
  const offerGroups = useMemo(() => {
    const order: string[]               = [];
    const map   = new Map<string, { title: string; company: string; apps: OwnerApplication[] }>();

    for (const a of localApps) {
      if (!map.has(a.offer_id)) {
        order.push(a.offer_id);
        map.set(a.offer_id, { title: a.offer_title, company: a.offer_company, apps: [] });
      }
      const filtered = statusFilter === "all" || a.status === statusFilter;
      if (filtered) map.get(a.offer_id)!.apps.push(a);
    }

    return order
      .map(id => ({ id, ...map.get(id)! }))
      .filter(g => g.apps.length > 0);
  }, [localApps, statusFilter]);

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
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as ApplicationStatus | "all")}
          className="bg-[#0a0c12] border border-[#1e2130] rounded-lg px-3 py-1.5 text-xs text-[#9ca3af] focus:outline-none focus:border-indigo-500/40"
        >
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="viewed">Viewed</option>
          <option value="interview">Interview</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      <div className="p-5 space-y-6">
        {offerGroups.length === 0 ? (
          <p className="text-sm text-[#374151] text-center py-8">No applications match this filter.</p>
        ) : (
          offerGroups.map(group => (
            <OfferGroup
              key={group.id}
              offerId={group.id}
              offerTitle={group.title}
              offerCompany={group.company}
              apps={group.apps}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
