"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { upsertCRMSubmission } from "@/app/dashboard/crm/actions";
import Button from "@/components/ui/Button";

const STATUS_OPTIONS = [
  { value: "new_lead",       label: "New Lead"       },
  { value: "contacted",      label: "Contacted"      },
  { value: "follow_up",      label: "Follow Up"      },
  { value: "interested",     label: "Interested"     },
  { value: "not_interested", label: "Not Interested" },
  { value: "closed",         label: "Closed"         },
];

const OUTCOME_OPTIONS = [
  { value: "pending", label: "Pending"  },
  { value: "won",     label: "Won"      },
  { value: "lost",    label: "Lost"     },
];

const inputCls =
  "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-2.5 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";

const labelCls = "block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5";

export default function SubmissionForm() {
  const [state, formAction, isPending] = useActionState(upsertCRMSubmission, null);
  const [showOptional, setShowOptional] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-[#f0f2f8] mb-5">Log a Contact</h2>

      {state?.success && (
        <div className="flex items-center gap-2 mb-4 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Entry saved.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {/* Row 1: contact name + company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Contact Name <span className="text-rose-400">*</span></label>
            <input name="contact_name" type="text" required placeholder="Jane Smith" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Company</label>
            <input name="company" type="text" placeholder="Acme Corp" className={inputCls} />
          </div>
        </div>

        {/* Row 2: status + outcome */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Status</label>
            <select name="status" defaultValue="new_lead" className={inputCls}>
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Outcome</label>
            <select name="outcome" defaultValue="pending" className={inputCls}>
              {OUTCOME_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: deal value + date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Deal Value (£)</label>
            <input name="deal_value" type="number" min="0" step="0.01" placeholder="0.00" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input name="submission_date" type="date" defaultValue={today} className={inputCls} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Call notes, objections, next steps…"
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Optional fields toggle */}
        <button
          type="button"
          onClick={() => setShowOptional(v => !v)}
          className="flex items-center gap-1.5 text-xs text-[#4b5563] hover:text-[#9ca3af] transition-colors"
        >
          {showOptional ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showOptional ? "Hide" : "Show"} optional fields
        </button>

        {showOptional && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className={labelCls}>Email</label>
              <input name="contact_email" type="email" placeholder="jane@acme.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input name="contact_phone" type="tel" placeholder="+44 7700 000000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Follow-up Date</label>
              <input name="next_followup" type="date" className={inputCls} />
            </div>
          </div>
        )}

        {state?.error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-4 py-3">
            <p className="text-xs text-rose-400">{state.error}</p>
          </div>
        )}

        <Button type="submit" size="md" loading={isPending}>
          Save entry
        </Button>
      </form>
    </div>
  );
}
