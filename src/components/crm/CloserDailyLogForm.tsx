"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Clock } from "lucide-react";
import type { CrmFieldDef, LogValueMap } from "@/lib/closer-crm-queries";
import { saveCloserDailyLog } from "@/app/dashboard/crm/closer-field-actions";

const inputCls = "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2.5 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";

function FieldInput({ field, defaultValue }: { field: CrmFieldDef; defaultValue: LogValueMap[string] | undefined }) {
  const name = `field_${field.id}`;

  if (field.field_type === "boolean") {
    return (
      <label className="flex items-center gap-3 cursor-pointer group select-none">
        <input
          type="checkbox"
          name={name}
          value="true"
          defaultChecked={defaultValue?.boolean === true}
          className="w-4 h-4 rounded border-[#1e2130] bg-[#0d0f15] accent-indigo-500 cursor-pointer"
        />
        <span className="text-sm text-[#9ca3af] group-hover:text-[#f0f2f8] transition-colors">
          {field.field_label}
        </span>
      </label>
    );
  }

  if (field.field_type === "duration") {
    return (
      <div className="relative">
        <input
          type="number"
          name={name}
          min="0"
          step="1"
          placeholder="0"
          defaultValue={defaultValue?.number ?? ""}
          className={inputCls + " pr-16"}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-[#4b5563] pointer-events-none">
          <Clock className="w-3 h-3" /> min
        </div>
      </div>
    );
  }

  if (field.field_type === "text") {
    return (
      <input
        type="text"
        name={name}
        placeholder="—"
        defaultValue={defaultValue?.text ?? ""}
        className={inputCls}
      />
    );
  }

  // number
  return (
    <input
      type="number"
      name={name}
      min="0"
      step="any"
      placeholder="0"
      defaultValue={defaultValue?.number ?? ""}
      className={inputCls}
    />
  );
}

interface Props {
  fields: CrmFieldDef[];
  todayValues: LogValueMap;
  onOpenBuilder: () => void;
}

export default function CloserDailyLogForm({ fields, todayValues, onOpenBuilder }: Props) {
  const router    = useRouter();
  const formRef   = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activeFields  = fields.filter(f => f.is_active);
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current || isLoading) return;
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    const fd = new FormData(formRef.current);
    fd.set("field_ids", activeFields.map(f => f.id).join(","));
    fd.set("log_date", today);

    // Checkboxes that aren't checked won't appear in FormData — explicitly add false
    for (const f of activeFields) {
      if (f.field_type === "boolean" && !fd.has(`field_${f.id}`)) {
        fd.set(`field_${f.id}`, "false");
      }
    }

    const result = await saveCloserDailyLog(null, fd);
    setIsLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      // Clear success message after 3 s
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  if (activeFields.length === 0) {
    return (
      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm text-[#6b7280]">No active fields. Open field settings to add some.</p>
        <button
          type="button"
          onClick={onOpenBuilder}
          className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Customise Fields →
        </button>
      </div>
    );
  }

  // Booleans get their own row at the bottom; everything else in a grid
  const gridFields    = activeFields.filter(f => f.field_type !== "boolean");
  const booleanFields = activeFields.filter(f => f.field_type === "boolean");

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest">Today&apos;s Log</p>
        <span className="text-[11px] text-[#374151]">{today}</span>
      </div>

      {/* Number / duration / text fields */}
      {gridFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gridFields.map(f => (
            <div key={f.id}>
              <label className="block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1.5">
                {f.field_label}
              </label>
              <FieldInput field={f} defaultValue={todayValues[f.id]} />
            </div>
          ))}
        </div>
      )}

      {/* Boolean / Yes-No fields */}
      {booleanFields.length > 0 && (
        <div className="flex flex-wrap gap-6 pt-1">
          {booleanFields.map(f => (
            <FieldInput key={f.id} field={f} defaultValue={todayValues[f.id]} />
          ))}
        </div>
      )}

      {/* Status messages */}
      {error   && <p className="text-xs text-rose-400">{error}</p>}
      {success && <p className="text-xs text-emerald-400">Saved successfully.</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-sm font-semibold text-indigo-300 transition-colors disabled:opacity-50"
      >
        {isLoading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Save className="w-3.5 h-3.5" />
        }
        {isLoading ? "Saving…" : "Save Log"}
      </button>
    </form>
  );
}
