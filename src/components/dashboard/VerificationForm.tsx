"use client";

import { useState } from "react";
import { ShieldCheck, Send, Clock, XCircle, CalendarDays } from "lucide-react";
import Button from "@/components/ui/Button";

type VerificationStatus = "none" | "pending" | "verified" | "rejected";

interface VerificationRequest {
  manager_name:            string;
  manager_company:         string;
  manager_email:           string;
  status:                  string;
  created_at:              string;
  verified_at:             string | null;
  verification_start_date: string | null;
}

interface Props {
  status:   VerificationStatus;
  existing: VerificationRequest | null;
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const today = new Date().toISOString().split("T")[0];

export default function VerificationForm({ status: initialStatus, existing }: Props) {
  const [status,        setStatus]        = useState(initialStatus);
  const [managerName,   setManagerName]   = useState("");
  const [managerCompany, setManagerCompany] = useState("");
  const [managerEmail,  setManagerEmail]  = useState("");
  const [startDate,     setStartDate]     = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [sent,          setSent]          = useState(false);
  const [sentManager,   setSentManager]   = useState({ name: "", company: "", email: "", startDate: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!startDate) { setError("Please enter the date you started working with this manager."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerName:           managerName.trim(),
          managerCompany:        managerCompany.trim(),
          managerEmail:          managerEmail.trim(),
          verificationStartDate: startDate,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Something went wrong."); return; }
      setSentManager({ name: managerName.trim(), company: managerCompany.trim(), email: managerEmail.trim(), startDate });
      setSent(true);
      setStatus("pending");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Already verified ──────────────────────────────────────────
  if (status === "verified" && existing) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 space-y-3">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400 mb-0.5">Verified</p>
            <p className="text-sm text-[#f0f2f8]">
              Verified by <strong>{existing.manager_name}</strong> · {existing.manager_company}
            </p>
            {existing.verification_start_date && (
              <p className="text-xs text-[#6b7280] mt-1 flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3" />
                Period verified: {fmtDate(existing.verification_start_date)} – today
              </p>
            )}
            <p className="text-xs text-[#6b7280] mt-1">
              Your public stats card shows the verified badge and period stats.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending ───────────────────────────────────────────────────
  if ((status === "pending" || sent) && (existing || sent)) {
    const name      = existing?.manager_name    ?? sentManager.name;
    const company   = existing?.manager_company ?? sentManager.company;
    const email     = existing?.manager_email   ?? sentManager.email;
    const startD    = existing?.verification_start_date ?? sentManager.startDate;
    return (
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 space-y-1">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-400 mb-0.5">Awaiting verification</p>
            <p className="text-sm text-[#f0f2f8]">
              Request sent to <strong>{email}</strong>
            </p>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Waiting for <strong>{name}</strong> at {company} to confirm.
            </p>
            {startD && (
              <p className="text-xs text-[#6b7280] mt-1 flex items-center gap-1.5">
                <CalendarDays className="w-3 h-3" />
                Period: {fmtDate(startD)} – today
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Rejected — show form again with note ─────────────────────
  const isRejected = status === "rejected";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isRejected && (
        <div className="flex items-start gap-3 bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 mb-2">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-300 leading-relaxed">
            Your previous verification request was declined. You can submit a new one below.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Manager&apos;s Name</label>
          <input
            type="text" value={managerName} onChange={e => setManagerName(e.target.value)}
            placeholder="Jane Smith" required
            className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Company</label>
          <input
            type="text" value={managerCompany} onChange={e => setManagerCompany(e.target.value)}
            placeholder="Acme Sales Co." required
            className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">Manager&apos;s Email</label>
        <input
          type="email" value={managerEmail} onChange={e => setManagerEmail(e.target.value)}
          placeholder="jane@acme.com" required
          className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
          Date you started working with this manager
        </label>
        <input
          type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
          max={today} required
          className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
        <p className="text-[11px] text-[#6b7280] mt-1.5">
          Only stats from this date to today will be included in the verification email. Your manager only vouches for the time they worked with you.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}

      <Button type="submit" loading={loading} className="gap-2">
        <Send className="w-4 h-4" />
        Send verification request
      </Button>

      <p className="text-xs text-[#6b7280]">
        Your manager receives a branded email with stats from the selected period and a one-click verify button.
        You can only have one active request at a time.
      </p>
    </form>
  );
}
