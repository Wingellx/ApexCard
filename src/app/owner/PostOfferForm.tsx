"use client";

import { useActionState } from "react";
import { postOffer } from "./offer-actions";
import { Briefcase, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_TYPES = [
  { value: "dm_setter", label: "DM Setter" },
  { value: "dialling",  label: "Dialling"  },
  { value: "closing",   label: "Closing"   },
];

const B2B_B2C_OPTIONS = [
  { value: "b2b",  label: "B2B"       },
  { value: "b2c",  label: "B2C"       },
  { value: "both", label: "B2B + B2C" },
];

const inputClass =
  "w-full bg-[#0a0c12] border border-[#1e2130] rounded-xl px-4 py-3 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors";

const labelClass =
  "text-[10px] font-bold text-[#4b5563] uppercase tracking-widest block mb-1.5";

export default function PostOfferForm() {
  const [state, action, pending] = useActionState(postOffer, { error: null });

  return (
    <div className="bg-[#0f1117] border border-[#1e2130] rounded-2xl overflow-hidden">
      {/* Section header */}
      <div className="border-b border-[#1e2130] px-5 py-4 flex items-center gap-2">
        <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
        <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest">
          Offer Board — Post a Role
        </p>
      </div>

      <form action={action} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Title */}
        <div className="sm:col-span-2">
          <label htmlFor="po-title" className={labelClass}>Role Title *</label>
          <input
            id="po-title"
            name="title"
            type="text"
            required
            placeholder="e.g. High Ticket Closer — Fitness Transformation"
            className={inputClass}
          />
        </div>

        {/* Company */}
        <div>
          <label htmlFor="po-company" className={labelClass}>Company / Offer Name *</label>
          <input
            id="po-company"
            name="company_name"
            type="text"
            required
            placeholder="e.g. Transform Elite"
            className={inputClass}
          />
        </div>

        {/* Niche */}
        <div>
          <label htmlFor="po-niche" className={labelClass}>Niche *</label>
          <input
            id="po-niche"
            name="niche"
            type="text"
            required
            placeholder="e.g. Fitness, Finance, Coaching"
            className={inputClass}
          />
        </div>

        {/* Role type */}
        <div>
          <label htmlFor="po-role-type" className={labelClass}>Role Type *</label>
          <select
            id="po-role-type"
            name="role_type"
            required
            defaultValue=""
            className={cn(inputClass, "cursor-pointer")}
          >
            <option value="" disabled>Select a type…</option>
            {ROLE_TYPES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* B2B / B2C */}
        <div>
          <label htmlFor="po-b2b" className={labelClass}>Market Type *</label>
          <select
            id="po-b2b"
            name="b2b_b2c"
            required
            defaultValue=""
            className={cn(inputClass, "cursor-pointer")}
          >
            <option value="" disabled>Select market type…</option>
            {B2B_B2C_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Commission */}
        <div>
          <label htmlFor="po-commission" className={labelClass}>Commission % (optional)</label>
          <input
            id="po-commission"
            name="commission_pct"
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="e.g. 20"
            className={inputClass}
          />
        </div>

        {/* Base pay */}
        <div>
          <label htmlFor="po-base" className={labelClass}>Base Pay / Month (optional)</label>
          <input
            id="po-base"
            name="base_pay"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 2500"
            className={inputClass}
          />
        </div>

        {/* Application limit */}
        <div>
          <label htmlFor="po-app-limit" className={labelClass}>Application Limit</label>
          <input
            id="po-app-limit"
            name="application_limit"
            type="number"
            min="1"
            step="1"
            defaultValue={50}
            placeholder="50"
            className={inputClass}
          />
        </div>

        {/* Expiry */}
        <div>
          <label htmlFor="po-expires" className={labelClass}>Expiry Date (optional)</label>
          <input
            id="po-expires"
            name="expires_at"
            type="date"
            className={inputClass}
          />
        </div>

        {/* Application URL */}
        <div className="sm:col-span-2">
          <label htmlFor="po-url" className={labelClass}>Google Form Application URL *</label>
          <input
            id="po-url"
            name="application_url"
            type="url"
            required
            placeholder="https://forms.gle/…"
            className={inputClass}
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label htmlFor="po-desc" className={labelClass}>Description</label>
          <textarea
            id="po-desc"
            name="description"
            rows={3}
            placeholder="Describe the role, offer and environment…"
            className={cn(inputClass, "resize-none")}
          />
        </div>

        {/* Requirements */}
        <div className="sm:col-span-2">
          <label htmlFor="po-req" className={labelClass}>Requirements</label>
          <textarea
            id="po-req"
            name="requirements"
            rows={3}
            placeholder="List the requirements for this role…"
            className={cn(inputClass, "resize-none")}
          />
        </div>

        {/* Featured toggle */}
        <div className="sm:col-span-2 flex items-center gap-3">
          <input
            id="po-featured"
            name="is_featured"
            type="checkbox"
            className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
          />
          <label htmlFor="po-featured" className="text-sm text-[#9ca3af] cursor-pointer select-none">
            Mark as Featured
          </label>
        </div>

        {/* Gating requirements */}
        <div className="sm:col-span-2 pt-3 border-t border-[#1e2130] space-y-3">
          <p className={labelClass}>Applicant Requirements (optional)</p>
          <div className="flex items-center gap-3">
            <input
              id="po-verified"
              name="requires_verified"
              type="checkbox"
              className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
            />
            <label htmlFor="po-verified" className="text-sm text-[#9ca3af] cursor-pointer select-none">
              Verified reps only
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="po-min-cash" className={labelClass}>Min Cash Collected ($)</label>
              <input
                id="po-min-cash"
                name="min_cash_collected"
                type="number"
                min="0"
                step="1000"
                placeholder="e.g. 50000"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="po-min-cr" className={labelClass}>Min Close Rate (%)</label>
              <input
                id="po-min-cr"
                name="min_close_rate"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="e.g. 20"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {state.error && (
          <div className="sm:col-span-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-rose-400">{state.error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 text-cyan-300 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
            {pending ? "Posting…" : "Post Offer to SetByOffers"}
          </button>
        </div>
      </form>
    </div>
  );
}
