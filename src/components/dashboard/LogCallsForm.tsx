"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitCallLog } from "@/app/dashboard/log/actions";
import { useToast } from "@/components/ui/ToastProvider";
import Button from "@/components/ui/Button";
import {
  PhoneCall,
  Users,
  UserX,
  Handshake,
  Trophy,
  DollarSign,
  Wallet,
  FileText,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

function today() {
  return new Date().toISOString().split("T")[0];
}

function pct(num: number, den: number) {
  if (!den) return "—";
  return `${((num / den) * 100).toFixed(1)}%`;
}

function fmt(val: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);
}

interface FieldProps {
  label: string;
  sublabel?: string;
  name: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  type?: "number" | "date" | "text" | "textarea";
  prefix?: string;
  min?: string;
  placeholder?: string;
  readOnly?: boolean;
  accent?: string;
}

function Field({
  label,
  sublabel,
  name,
  icon,
  value,
  onChange,
  type = "number",
  prefix,
  min = "0",
  placeholder,
  readOnly,
  accent = "border-[#1e2130] focus:border-indigo-500 focus:ring-indigo-500",
}: FieldProps) {
  const inputClass = cn(
    "w-full bg-[#0d0f15] border rounded-lg text-sm text-[#f0f2f8] placeholder-[#6b7280]",
    "focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-150",
    readOnly ? "opacity-50 cursor-not-allowed" : "",
    prefix ? "pl-8 pr-4 py-3" : "px-4 py-3",
    accent
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
        <span className="text-zinc-500">{icon}</span>
        {label}
        {sublabel && <span className="normal-case text-zinc-600 font-normal tracking-normal">· {sublabel}</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6b7280] pointer-events-none">
            {prefix}
          </span>
        )}
        {type === "textarea" ? (
          <textarea
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={cn(inputClass, "resize-none")}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={type === "number" ? min : undefined}
            placeholder={placeholder}
            readOnly={readOnly}
            className={inputClass}
          />
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/50 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={cn("text-sm font-bold tabular-nums", color)}>{value}</span>
    </div>
  );
}

export default function LogCallsForm() {
  const [state, formAction, isPending] = useActionState(submitCallLog, null);
  const { success, error } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state?.success) { success("Call log saved."); router.push("/dashboard"); }
    if (state?.error)   error(state.error);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const [date, setDate] = useState(today());
  const [callsTaken, setCallsTaken] = useState("");
  const [shows, setShows] = useState("");
  const [offersMade, setOffersMade] = useState("");
  const [offersTaken, setOffersTaken] = useState("");
  const [cash, setCash] = useState("");
  const [commission, setCommission] = useState("");
  const [notes, setNotes] = useState("");

  // Derived
  const callsNum = parseInt(callsTaken) || 0;
  const showsNum = parseInt(shows) || 0;
  const noShows = Math.max(callsNum - showsNum, 0);
  const offersNum = parseInt(offersMade) || 0;
  const closedNum = parseInt(offersTaken) || 0;
  const cashNum = parseFloat(cash) || 0;

  const showRate = pct(showsNum, callsNum);
  const closeRate = pct(closedNum, showsNum);
  const cashPerClose = closedNum > 0 ? fmt(cashNum / closedNum) : "—";

  return (
    <form action={formAction}>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left col: form fields */}
        <div className="xl:col-span-2 space-y-6">

          {/* Date */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Log Date</p>
            <Field
              label="Date"
              name="date"
              icon={<CalendarDays className="w-3.5 h-3.5" />}
              value={date}
              onChange={setDate}
              type="date"
              accent="border-[#1e2130] focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* Call volume */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Call Volume</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label="Calls Taken"
                name="calls_taken"
                icon={<PhoneCall className="w-3.5 h-3.5" />}
                value={callsTaken}
                onChange={setCallsTaken}
                placeholder="0"
                accent="border-[#1e2130] focus:border-indigo-500 focus:ring-indigo-500"
              />
              <Field
                label="Shows"
                name="shows"
                icon={<Users className="w-3.5 h-3.5" />}
                value={shows}
                onChange={setShows}
                placeholder="0"
                accent="border-[#1e2130] focus:border-emerald-500 focus:ring-emerald-500"
              />
              <Field
                label="No Shows"
                sublabel="auto"
                name="_no_shows"
                icon={<UserX className="w-3.5 h-3.5" />}
                value={noShows > 0 ? String(noShows) : ""}
                onChange={() => {}}
                placeholder="0"
                readOnly
                accent="border-[#1e2130]"
              />
            </div>
          </div>

          {/* Offers & closes */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Offers & Closes</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Offers Made"
                name="offers_made"
                icon={<Handshake className="w-3.5 h-3.5" />}
                value={offersMade}
                onChange={setOffersMade}
                placeholder="0"
                accent="border-[#1e2130] focus:border-amber-500 focus:ring-amber-500"
              />
              <Field
                label="Closed"
                name="offers_taken"
                icon={<Trophy className="w-3.5 h-3.5" />}
                value={offersTaken}
                onChange={setOffersTaken}
                placeholder="0"
                accent="border-[#1e2130] focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Revenue</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Cash Collected"
                name="cash_collected"
                icon={<DollarSign className="w-3.5 h-3.5" />}
                value={cash}
                onChange={setCash}
                prefix="$"
                placeholder="0"
                accent="border-[#1e2130] focus:border-emerald-500 focus:ring-emerald-500"
              />
              <Field
                label="Commission Earned"
                name="commission_earned"
                icon={<Wallet className="w-3.5 h-3.5" />}
                value={commission}
                onChange={setCommission}
                prefix="$"
                placeholder="0"
                accent="border-[#1e2130] focus:border-violet-500 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#111318] border border-[#1e2130] rounded-xl p-6">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Notes</p>
            <Field
              label="Notes"
              name="notes"
              icon={<FileText className="w-3.5 h-3.5" />}
              value={notes}
              onChange={setNotes}
              type="textarea"
              placeholder="What went well? What to improve tomorrow?"
              accent="border-[#1e2130] focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* Error */}
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
              <p className="text-sm text-red-400">{state.error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pb-10">
            <a href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-100 transition-colors duration-150">
              Cancel
            </a>
            <Button type="submit" size="lg" loading={isPending}>
              Save Log
            </Button>
          </div>
        </div>

        {/* Right col: live stats preview */}
        <div className="xl:col-span-1">
          <div className="sticky top-8 bg-[#111318] border border-[#1e2130] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Today&apos;s Stats</p>
            </div>

            <div className="space-y-0">
              <StatPill
                label="No Shows"
                value={noShows > 0 ? String(noShows) : "—"}
                color="text-rose-400"
              />
              <StatPill
                label="Show Rate"
                value={showRate}
                color={showsNum / callsNum >= 0.7 ? "text-emerald-400" : "text-amber-400"}
              />
              <StatPill
                label="Close Rate"
                value={closeRate}
                color={closedNum / showsNum >= 0.3 ? "text-emerald-400" : "text-amber-400"}
              />
              <StatPill
                label="Cash / Close"
                value={cashPerClose}
                color="text-emerald-400"
              />
            </div>

            {/* Mini visual */}
            {callsNum > 0 && (
              <div className="mt-6 space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] text-[#6b7280] mb-1">
                    <span>Show rate</span>
                    <span>{showRate}</span>
                  </div>
                  <div className="h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((showsNum / callsNum) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                {showsNum > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] text-[#6b7280] mb-1">
                      <span>Close rate</span>
                      <span>{closeRate}</span>
                    </div>
                    <div className="h-1.5 bg-[#1e2130] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((closedNum / showsNum) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-[10px] text-zinc-600 mt-6 text-center">Updates as you type</p>
          </div>
        </div>
      </div>
    </form>
  );
}
