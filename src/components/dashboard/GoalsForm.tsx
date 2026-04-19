"use client";

import { useActionState, useState } from "react";
import { upsertGoals } from "@/app/dashboard/goals/actions";
import Button from "@/components/ui/Button";
import {
  PhoneCall, TrendingUp, Target, Handshake, DollarSign, Wallet, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExistingGoals {
  calls_target: number;
  show_rate_target: number;
  close_rate_target: number;
  offers_target: number;
  cash_target: number;
  commission_target: number;
}

interface GoalsFormProps {
  initialMonth: string;        // "2026-04"
  existing: ExistingGoals | null;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ── Field components ─────────────────────────────────────────────────────────

interface FieldGroupProps { title: string; children: React.ReactNode }
function FieldGroup({ title, children }: FieldGroupProps) {
  return (
    <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6">
      <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-5">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  name: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  hint?: string;
  focusColor?: string;
}
function InputField({
  label, name, icon, value, onChange,
  prefix, suffix, placeholder, hint, focusColor = "focus:border-indigo-500 focus:ring-indigo-500",
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
        <span>{icon}</span>{label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min="0"
          step={suffix === "%" ? "0.1" : "1"}
          placeholder={placeholder ?? "0"}
          className={cn(
            "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg text-sm text-[#f0f2f8] placeholder-[#6b7280]",
            "focus:outline-none focus:ring-1 transition-colors",
            focusColor,
            prefix ? "pl-8" : "pl-4",
            suffix ? "pr-10" : "pr-4",
            "py-3"
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-[10px] text-[#6b7280]/60">{hint}</p>}
    </div>
  );
}

// ── Summary card ─────────────────────────────────────────────────────────────

function SummaryRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1e2130] last:border-0">
      <span className="text-xs text-[#6b7280]">{label}</span>
      <span className={cn("text-sm font-bold tabular-nums", color)}>{value || "—"}</span>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function GoalsForm({ initialMonth, existing }: GoalsFormProps) {
  const [state, formAction, isPending] = useActionState(upsertGoals, null);
  const [month, setMonth] = useState(initialMonth);

  const [calls, setCalls]         = useState(String(existing?.calls_target ?? ""));
  const [showRate, setShowRate]   = useState(String(existing?.show_rate_target ?? ""));
  const [closeRate, setCloseRate] = useState(String(existing?.close_rate_target ?? ""));
  const [offers, setOffers]       = useState(String(existing?.offers_target ?? ""));
  const [cash, setCash]           = useState(String(existing?.cash_target ?? ""));
  const [commission, setCommission] = useState(String(existing?.commission_target ?? ""));

  const isCurrentMonth = month === currentMonth();

  return (
    <form action={formAction}>
      <input type="hidden" name="month" value={month} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left: form ───────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Month picker */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6">
            <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-4">Target Month</p>
            <div className="flex items-center gap-3">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-[#0d0f15] border border-[#1e2130] rounded-lg px-4 py-3 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {isCurrentMonth && (
                <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full">
                  Current month
                </span>
              )}
              <span className="text-sm text-[#6b7280]">{monthLabel(month)}</span>
            </div>
          </div>

          {/* Call volume targets */}
          <FieldGroup title="Call Volume">
            <InputField
              label="Calls Taken"
              name="calls_target"
              icon={<PhoneCall className="w-3.5 h-3.5" />}
              value={calls}
              onChange={setCalls}
              placeholder="120"
              hint="Total calls you aim to take this month"
              focusColor="focus:border-indigo-500 focus:ring-indigo-500"
            />
            <InputField
              label="Offers Made"
              name="offers_target"
              icon={<Handshake className="w-3.5 h-3.5" />}
              value={offers}
              onChange={setOffers}
              placeholder="40"
              hint="Total pitches you aim to make"
              focusColor="focus:border-amber-500 focus:ring-amber-500"
            />
          </FieldGroup>

          {/* Rate targets */}
          <FieldGroup title="Conversion Rates">
            <InputField
              label="Show Rate"
              name="show_rate_target"
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              value={showRate}
              onChange={setShowRate}
              suffix="%"
              placeholder="80.0"
              hint="Target % of calls that show"
              focusColor="focus:border-emerald-500 focus:ring-emerald-500"
            />
            <InputField
              label="Close Rate"
              name="close_rate_target"
              icon={<Target className="w-3.5 h-3.5" />}
              value={closeRate}
              onChange={setCloseRate}
              suffix="%"
              placeholder="35.0"
              hint="Target % of shows that close"
              focusColor="focus:border-emerald-500 focus:ring-emerald-500"
            />
          </FieldGroup>

          {/* Revenue targets */}
          <FieldGroup title="Revenue">
            <InputField
              label="Cash Collected"
              name="cash_target"
              icon={<DollarSign className="w-3.5 h-3.5" />}
              value={cash}
              onChange={setCash}
              prefix="$"
              placeholder="100,000"
              hint="Total revenue you aim to close"
              focusColor="focus:border-emerald-500 focus:ring-emerald-500"
            />
            <InputField
              label="Commission Earned"
              name="commission_target"
              icon={<Wallet className="w-3.5 h-3.5" />}
              value={commission}
              onChange={setCommission}
              prefix="$"
              placeholder="15,000"
              hint="Total commission you aim to earn"
              focusColor="focus:border-violet-500 focus:ring-violet-500"
            />
          </FieldGroup>

          {/* Feedback */}
          {state?.success && (
            <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-400 font-medium">Goals saved for {monthLabel(month)}.</p>
            </div>
          )}
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
              <p className="text-sm text-red-400">{state.error}</p>
            </div>
          )}

          <div className="flex justify-end pb-10">
            <Button type="submit" size="lg" loading={isPending}>
              Save Goals
            </Button>
          </div>
        </div>

        {/* ── Right: live summary ───────────────────────── */}
        <div className="xl:col-span-1">
          <div className="sticky top-8 space-y-4">

            {/* Targets at a glance */}
            <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6">
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-4">
                {monthLabel(month)} Targets
              </p>
              <div>
                <SummaryRow label="Calls Taken"     value={calls}      color="text-indigo-400" />
                <SummaryRow label="Offers Made"     value={offers}     color="text-amber-400" />
                <SummaryRow label="Show Rate"       value={showRate ? `${showRate}%` : ""}   color="text-emerald-400" />
                <SummaryRow label="Close Rate"      value={closeRate ? `${closeRate}%` : ""} color="text-emerald-400" />
                <SummaryRow label="Cash Collected"  value={cash ? `$${Number(cash).toLocaleString()}` : ""}            color="text-emerald-400" />
                <SummaryRow label="Commission"      value={commission ? `$${Number(commission).toLocaleString()}` : ""} color="text-violet-400" />
              </div>
            </div>

            {/* Implied math */}
            {calls && showRate && closeRate && (
              <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6">
                <p className="text-[11px] font-semibold text-[#6b7280] uppercase tracking-widest mb-4">
                  Implied Numbers
                </p>
                <div>
                  {(() => {
                    const c = parseInt(calls) || 0;
                    const sr = parseFloat(showRate) / 100 || 0;
                    const cr = parseFloat(closeRate) / 100 || 0;
                    const impliedShows = Math.round(c * sr);
                    const impliedCloses = Math.round(impliedShows * cr);
                    const cashPerClose = impliedCloses > 0 && cash
                      ? `$${Math.round(parseFloat(cash) / impliedCloses).toLocaleString()}`
                      : "—";
                    return (
                      <>
                        <SummaryRow label="Implied Shows"  value={String(impliedShows)}  color="text-[#f0f2f8]" />
                        <SummaryRow label="Implied Closes" value={String(impliedCloses)} color="text-[#f0f2f8]" />
                        <SummaryRow label="Cash / Close"   value={cashPerClose}           color="text-emerald-400" />
                      </>
                    );
                  })()}
                </div>
                <p className="text-[10px] text-[#6b7280]/50 mt-4 leading-relaxed">
                  Based on your rate targets applied to your call volume.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
