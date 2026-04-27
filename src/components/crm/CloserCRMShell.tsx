"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { CrmFieldDef, LogValueMap, CrmCustomLog } from "@/lib/closer-crm-queries";
import CloserTemplateSelect from "./CloserTemplateSelect";
import CloserLogForm from "./CloserLogForm";
import CloserEditMode from "./CloserEditMode";
import CloserHistory from "./CloserHistory";

interface Props {
  fields: CrmFieldDef[];
  todayValues: LogValueMap;
  history: CrmCustomLog[];
}

export default function CloserCRMShell({ fields: serverFields, todayValues, history }: Props) {
  const router = useRouter();
  const [fields, setFields] = useState<CrmFieldDef[]>(serverFields);
  const [mode, setMode] = useState<"log" | "edit">("log");

  // true once any template (including custom) has been chosen this session
  const [setupStarted, setSetupStarted] = useState(serverFields.length > 0);

  // Sync from server after router.refresh(), but never overwrite valid local state with empty data
  useEffect(() => {
    setFields(prev => serverFields.length > 0 ? serverFields : prev);
  }, [serverFields]);

  function handleFieldsChange(updated: CrmFieldDef[]) {
    setFields(updated);
    router.refresh();
  }

  // ── Template selection ────────────────────────────────────────────────────

  const showTemplateSelect = !setupStarted && fields.length === 0;

  if (showTemplateSelect) {
    return (
      <CloserTemplateSelect
        onSelect={(newFields, openEdit) => {
          setSetupStarted(true);
          setFields(newFields);
          setMode(openEdit ? "edit" : "log");
          // No router.refresh() — revalidatePath in applyTemplate handles future cache invalidation;
          // local state is already populated from the server action's return value
        }}
      />
    );
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────

  if (mode === "edit") {
    return (
      <CloserEditMode
        fields={fields}
        onFieldsChange={handleFieldsChange}
        onDone={() => setMode("log")}
      />
    );
  }

  // ── Log mode ──────────────────────────────────────────────────────────────

  // Key forces form remount when active field set changes, so defaultValues refresh
  const activeKey = fields.filter(f => f.is_active).map(f => f.id).join(",");

  return (
    <div className="space-y-6">
      {/* Edit Fields button — top right */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest">Daily Log</p>
        <button
          type="button"
          onClick={() => setMode("edit")}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6b7280] hover:text-[#9ca3af] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Edit Fields
        </button>
      </div>

      <CloserLogForm
        key={activeKey}
        fields={fields}
        todayValues={todayValues}
        onOpenEdit={() => setMode("edit")}
      />

      <CloserHistory fields={fields} history={history} />
    </div>
  );
}
