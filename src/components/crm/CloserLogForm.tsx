"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import type { CrmFieldDef, LogValueMap } from "@/lib/closer-crm-queries";
import { saveCloserDailyLog } from "@/app/dashboard/crm/closer-field-actions";

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ name, defaultChecked }: { name: string; defaultChecked: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setOn(v => !v)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0f15]
          ${on ? "bg-indigo-500" : "bg-[#1e2130] border border-[#2a2f45]"}`}
        role="switch"
        aria-checked={on}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`} />
      </button>
      <span className={`text-sm font-medium transition-colors ${on ? "text-[#f0f2f8]" : "text-[#6b7280]"}`}>
        {on ? "Yes" : "No"}
      </span>
      <input type="hidden" name={name} value={on ? "true" : "false"} />
    </div>
  );
}

// ── Duration input (h + min) ──────────────────────────────────────────────────

function DurationInput({ name, defaultMinutes }: { name: string; defaultMinutes: number | null }) {
  const storedMins = defaultMinutes ?? 0;
  const [hours, setHours] = useState(Math.floor(storedMins / 60));
  const [mins,  setMins]  = useState(storedMins % 60);

  return (
    <div className="flex items-center gap-2">
      <input type="hidden" name={name} value={hours * 60 + mins} />
      <div className="relative">
        <input
          type="number"
          min="0"
          placeholder="0"
          value={hours === 0 ? "" : hours}
          onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-20 bg-[#0d0f15] border border-[#1e2130] rounded-xl px-3 py-3 text-base font-semibold text-[#f0f2f8] text-center focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <span className="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-[#4b5563]">hours</span>
      </div>
      <span className="text-[#374151] font-bold">:</span>
      <div className="relative">
        <input
          type="number"
          min="0"
          max="59"
          placeholder="0"
          value={mins === 0 ? "" : mins}
          onChange={e => setMins(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
          className="w-20 bg-[#0d0f15] border border-[#1e2130] rounded-xl px-3 py-3 text-base font-semibold text-[#f0f2f8] text-center focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <span className="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-[#4b5563]">min</span>
      </div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────

const numberInputCls = "w-full max-w-[200px] bg-[#0d0f15] border border-[#1e2130] rounded-xl px-4 py-3 text-base font-semibold text-[#f0f2f8] text-right focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-[#374151]";

function FieldRow({ field, defaultValue }: { field: CrmFieldDef; defaultValue: LogValueMap[string] | undefined }) {
  const name = `field_${field.id}`;

  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-[#1a1d28] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#e5e7eb]">{field.field_label}</p>
        <p className="text-[11px] text-[#374151] mt-0.5 capitalize">{field.field_type === "boolean" ? "Yes / No" : field.field_type}</p>
      </div>

      <div className="shrink-0">
        {field.field_type === "boolean" && (
          <Toggle name={name} defaultChecked={defaultValue?.boolean === true} />
        )}
        {field.field_type === "duration" && (
          <DurationInput name={name} defaultMinutes={defaultValue?.number ?? null} />
        )}
        {field.field_type === "number" && (
          <input
            type="number"
            name={name}
            min="0"
            step="any"
            placeholder="0"
            defaultValue={defaultValue?.number ?? ""}
            className={numberInputCls}
          />
        )}
        {field.field_type === "text" && (
          <input
            type="text"
            name={name}
            placeholder="—"
            defaultValue={defaultValue?.text ?? ""}
            className="w-48 bg-[#0d0f15] border border-[#1e2130] rounded-xl px-4 py-3 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-[#374151]"
          />
        )}
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface Props {
  fields: CrmFieldDef[];
  todayValues: LogValueMap;
  onOpenEdit: () => void;
}

export default function CloserLogForm({ fields, todayValues, onOpenEdit }: Props) {
  const router     = useRouter();
  const formRef    = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const activeFields = fields.filter(f => f.is_active);
  const today = new Date().toISOString().split("T")[0];
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current || status === "saving") return;

    setStatus("saving");
    setErrorMsg("");

    const fd = new FormData(formRef.current);
    fd.set("field_ids", activeFields.map(f => f.id).join(","));
    fd.set("log_date", today);

    const result = await saveCloserDailyLog(null, fd);

    if (result?.error) {
      setStatus("error");
      setErrorMsg(result.error);
    } else {
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  if (activeFields.length === 0) {
    return (
      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-10 text-center space-y-3">
        <p className="text-sm text-[#6b7280]">No active fields. Add some to start logging.</p>
        <button
          type="button"
          onClick={onOpenEdit}
          className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Edit Fields →
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden">
      {/* Date header */}
      <div className="px-6 py-4 border-b border-[#1a1d28]">
        <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-widest mb-0.5">Today&apos;s Log</p>
        <p className="text-sm font-semibold text-[#9ca3af]">{dateLabel}</p>
      </div>

      {/* Field rows */}
      <div className="px-6 pb-2">
        {activeFields.map(f => (
          <FieldRow key={f.id} field={f} defaultValue={todayValues[f.id]} />
        ))}
      </div>

      {/* Error */}
      {status === "error" && (
        <div className="mx-6 mb-4 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <p className="text-xs text-rose-400">{errorMsg}</p>
        </div>
      )}

      {/* Save button */}
      <div className="px-6 py-5">
        <button
          type="submit"
          disabled={status === "saving" || status === "saved"}
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold transition-all duration-200
            ${status === "saved"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default"
              : "bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 disabled:opacity-60"
            }`}
        >
          {status === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === "saved"  && <Check className="w-4 h-4" />}
          {status === "saving" ? "Saving…"
            : status === "saved" ? "Saved"
            : "Save Today's Log"}
        </button>
      </div>
    </form>
  );
}
