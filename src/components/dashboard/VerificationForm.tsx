"use client";

import { useState } from "react";
import { ShieldCheck, Send, Clock, CheckCircle2, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type VerificationStatus = "none" | "pending" | "verified" | "rejected";

interface VerificationRequest {
  manager_name: string;
  manager_company: string;
  manager_email: string;
  created_at: string;
  verified_at: string | null;
}

interface Props {
  status: VerificationStatus;
  existing: VerificationRequest | null;
}

function Field({
  label, name, type = "text", value, onChange, placeholder,
}: {
  label: string; name: string; type?: string;
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
      />
    </div>
  );
}

export default function VerificationForm({ status: initialStatus, existing }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [managerName, setManagerName]       = useState("");
  const [managerCompany, setManagerCompany] = useState("");
  const [managerEmail, setManagerEmail]     = useState("");
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");
  const [sent, setSent]                     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerName: managerName.trim(),
          managerCompany: managerCompany.trim(),
          managerEmail: managerEmail.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Something went wrong."); return; }
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
      <div className="flex items-start gap-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-400 mb-0.5">Verified</p>
          <p className="text-sm text-[#f0f2f8]">
            Verified by <strong>{existing.manager_name}</strong> · {existing.manager_company}
          </p>
          <p className="text-xs text-[#6b7280] mt-1">
            Your public stats card shows the verified badge.
          </p>
        </div>
      </div>
    );
  }

  // ── Pending ───────────────────────────────────────────────────
  if ((status === "pending" || sent) && existing) {
    return (
      <div className="flex items-start gap-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
        <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-400 mb-0.5">Pending</p>
          <p className="text-sm text-[#f0f2f8]">
            Verification request sent to <strong>{existing.manager_email}</strong>
          </p>
          <p className="text-xs text-[#6b7280] mt-1">
            Waiting for {existing.manager_name} at {existing.manager_company} to confirm.
          </p>
        </div>
      </div>
    );
  }

  // ── Just sent (no existing prop yet) ─────────────────────────
  if (sent) {
    return (
      <div className="flex items-start gap-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
        <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-400 mb-0.5">Pending</p>
          <p className="text-sm text-[#f0f2f8]">Request sent to <strong>{managerEmail}</strong></p>
          <p className="text-xs text-[#6b7280] mt-1">Waiting for {managerName} to confirm.</p>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Manager's Name"    name="managerName"    value={managerName}    onChange={setManagerName}    placeholder="Jane Smith" />
        <Field label="Company"           name="managerCompany" value={managerCompany} onChange={setManagerCompany} placeholder="Acme Sales Co." />
      </div>
      <Field label="Manager's Email" name="managerEmail" type="email" value={managerEmail} onChange={setManagerEmail} placeholder="jane@acme.com" />

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
        Your manager will receive a branded email with your stats summary and a one-click verify button.
        You can only have one active verification request at a time.
      </p>
    </form>
  );
}
