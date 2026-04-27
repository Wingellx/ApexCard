"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, CalendarDays } from "lucide-react";
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
        role="switch"
        aria-checked={on}
        className={`relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111318]
          ${on ? "bg-indigo-600" : "bg-[#1e2130]"}`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200
            ${on ? "translate-x-[22px]" : "translate-x-1"}`}
        />
      </button>
      <span className={`text-sm font-semibold min-w-[24px] transition-colors ${on ? "text-[#f0f2f8]" : "text-[#4b5563]"}`}>
        {on ? "Yes" : "No"}
      </span>
      <input type="hidden" name={name} value={on ? "true" : "false"} />
    </div>
  );
}

// ── Duration input ────────────────────────────────────────────────────────────

function DurationInput({ name, defaultMinutes }: { name: string; defaultMinutes: number | null }) {
  const stored = defaultMinutes ?? 0;
  const [hours, setHours] = useState(Math.floor(stored / 60));
  const [mins,  setMins]  = useState(stored % 60);

  return (
    <div className="flex items-center gap-2">
      <input type="hidden" name={name} value={hours * 60 + mins} />
      <div className="flex flex-col items-center gap-1">
        <input
          type="number"
          min="0"
          placeholder="0"
          value={hours === 0 ? "" : hours}
          onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-[68px] h-14 bg-[#0d0f15] border border-[#1e2130] rounded-xl text-xl font-bold text-[#f0f2f8] text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors placeholder-[#2a2f45]"
        />
        <span className="text-[10px] font-medium text-[#4b5563] uppercase tracking-wider">hrs</span>
      </div>
      <span className="text-[#2a2f45] text-xl font-bold pb-5">:</span>
      <div className="flex flex-col items-center gap-1">
        <input
          type="number"
          min="0"
          max="59"
          placeholder="0"
          value={mins === 0 ? "" : mins}
          onChange={e => setMins(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
          className="w-[68px] h-14 bg-[#0d0f15] border border-[#1e2130] rounded-xl text-xl font-bold text-[#f0f2f8] text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors placeholder-[#2a2f45]"
        />
        <span className="text-[10px] font-medium text-[#4b5563] uppercase tracking-wider">min</span>
      </div>
    </div>
  );
}

// ── Number input — optionally controlled ──────────────────────────────────────

function NumberInput({
  name,
  defaultVal,
  controlled,
  onChange,
}: {
  name: string;
  defaultVal: number | null;
  controlled?: number;
  onChange?: (v: number) => void;
}) {
  const isControlled = onChange !== undefined;
  const sharedCls = "w-28 h-14 bg-[#0d0f15] border border-[#1e2130] rounded-xl text-2xl font-bold text-[#f0f2f8] text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors placeholder-[#2a2f45]";

  if (isControlled) {
    return (
      <input
        type="number"
        name={name}
        min="0"
        step="any"
        placeholder="0"
        value={controlled === 0 ? "" : (controlled ?? "")}
        onChange={e => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className={sharedCls}
      />
    );
  }

  return (
    <input
      type="number"
      name={name}
      min="0"
      step="any"
      placeholder="0"
      defaultValue={defaultVal ?? ""}
      className={sharedCls}
    />
  );
}

// ── Derived Close % row ───────────────────────────────────────────────────────

function ClosePctRow({ taken, closed }: { taken: number; closed: number }) {
  const pct = taken > 0 ? Math.round((closed / taken) * 100) : null;

  return (
    <div className="flex items-center justify-between gap-6 px-6 py-5 border-b border-[#13161e] bg-[#0d0f15]/40">
      <div>
        <p className="text-sm font-medium text-[#6b7280]">Close %</p>
        <p className="text-[10px] text-[#2a2f45] mt-0.5 uppercase tracking-wider">Calculated</p>
      </div>
      <div className="flex items-center justify-center w-28 h-14">
        <span className={`text-2xl font-bold tabular-nums ${pct !== null ? "text-indigo-300" : "text-[#2a2f45]"}`}>
          {pct !== null ? `${pct}%` : "—"}
        </span>
      </div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────

function FieldRow({
  field,
  defaultValue,
  controlled,
  onControlledChange,
}: {
  field: CrmFieldDef;
  defaultValue: LogValueMap[string] | undefined;
  controlled?: number;
  onControlledChange?: (v: number) => void;
}) {
  const name = `field_${field.id}`;

  return (
    <div className="flex items-center justify-between gap-6 px-6 py-5 border-b border-[#13161e] last:border-0">
      <p className="text-sm font-medium text-[#6b7280] leading-snug">{field.field_label}</p>

      <div className="shrink-0">
        {field.field_type === "boolean" && (
          <Toggle name={name} defaultChecked={defaultValue?.boolean === true} />
        )}
        {field.field_type === "duration" && (
          <DurationInput name={name} defaultMinutes={defaultValue?.number ?? null} />
        )}
        {field.field_type === "number" && (
          <NumberInput
            name={name}
            defaultVal={defaultValue?.number ?? null}
            controlled={controlled}
            onChange={onControlledChange}
          />
        )}
        {field.field_type === "text" && (
          <input
            type="text"
            name={name}
            placeholder="—"
            defaultValue={defaultValue?.text ?? ""}
            className="w-48 h-11 bg-[#0d0f15] border border-[#1e2130] rounded-xl px-4 text-sm text-[#f0f2f8] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors placeholder-[#2a2f45]"
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
  const router  = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const activeFields = fields.filter(f => f.is_active);

  // Detect Calls Taken / Calls Closed for derived Close % display
  const takenField  = activeFields.find(f => f.field_name === "calls_taken");
  const closedField = activeFields.find(f => f.field_name === "calls_closed");
  const showClosePct = !!(takenField && closedField);

  const [callsTaken,  setCallsTaken]  = useState<number>(todayValues[takenField?.id  ?? ""]?.number ?? 0);
  const [callsClosed, setCallsClosed] = useState<number>(todayValues[closedField?.id ?? ""]?.number ?? 0);

  const today = new Date().toISOString().split("T")[0];
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current || status === "saving") return;

    setStatus("saving");

    const fd = new FormData(formRef.current);
    fd.set("field_ids", activeFields.map(f => f.id).join(","));
    fd.set("log_date", today);

    const result = await saveCloserDailyLog(null, fd);

    if (result?.error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    } else {
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  if (activeFields.length === 0) {
    return (
      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-12 text-center space-y-4">
        <p className="text-sm font-medium text-[#6b7280]">No active fields to log.</p>
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
      <div className="px-6 py-5 border-b border-[#13161e] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <CalendarDays className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#374151] uppercase tracking-[0.15em]">Today&apos;s Log</p>
          <p className="text-sm font-semibold text-[#e5e7eb] leading-tight mt-0.5">{dateLabel}</p>
        </div>
      </div>

      {/* Field rows — inject ClosePctRow after calls_closed */}
      <div>
        {activeFields.map(f => {
          const isTrackedTaken  = showClosePct && f.id === takenField!.id;
          const isTrackedClosed = showClosePct && f.id === closedField!.id;

          return (
            <div key={f.id}>
              <FieldRow
                field={f}
                defaultValue={todayValues[f.id]}
                controlled={isTrackedTaken ? callsTaken : isTrackedClosed ? callsClosed : undefined}
                onControlledChange={isTrackedTaken ? setCallsTaken : isTrackedClosed ? setCallsClosed : undefined}
              />
              {isTrackedClosed && (
                <ClosePctRow taken={callsTaken} closed={callsClosed} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {status === "error" && (
        <div className="mx-6 mb-1 px-4 py-3 bg-rose-500/[0.07] border border-rose-500/[0.15] rounded-xl">
          <p className="text-xs font-medium text-rose-400">Something went wrong — please try again.</p>
        </div>
      )}

      {/* Save button */}
      <div className="px-6 py-6">
        <button
          type="submit"
          disabled={status === "saving" || status === "saved"}
          className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-[15px] font-bold tracking-tight transition-all duration-200
            ${status === "saved"
              ? "bg-emerald-600 text-white cursor-default shadow-[0_0_24px_rgba(16,185,129,0.15)]"
              : status === "saving"
              ? "bg-indigo-600/70 text-white/70 cursor-default"
              : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-[0_0_24px_rgba(99,102,241,0.15)] hover:shadow-[0_0_32px_rgba(99,102,241,0.25)]"
            }`}
        >
          {status === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === "saved"  && <Check   className="w-4 h-4" />}
          {status === "saving" ? "Saving…"
            : status === "saved" ? "Saved"
            : "Save Today's Log"}
        </button>
      </div>
    </form>
  );
}
