"use client";

import { useState, useTransition } from "react";
import { GripVertical, Plus, Trash2, Eye, EyeOff, X, AlertTriangle, Loader2 } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CrmFieldDef, FieldType } from "@/lib/closer-crm-queries";
import {
  addCloserField, toggleCloserField, deleteCloserField, reorderCloserFields,
} from "@/app/dashboard/crm/closer-field-actions";

const TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: "number",   label: "Number"   },
  { value: "boolean",  label: "Yes / No" },
  { value: "text",     label: "Text"     },
  { value: "duration", label: "Duration" },
];

const inputCls = "w-full bg-[#0d0f15] border border-[#1e2130] rounded-lg px-3 py-2 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors";

// ── Sortable row ──────────────────────────────────────────────────────────────

function SortableFieldRow({
  field, onToggle, onDelete, disabled,
}: {
  field: CrmFieldDef;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    // Optimistic entries don't have a real DB row yet — disable drag for them
    disabled: field.id.startsWith("optimistic-"),
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.5 : 1,
    zIndex:     isDragging ? 10 : undefined,
  };

  const typeLabel = TYPE_OPTIONS.find(t => t.value === field.field_type)?.label ?? field.field_type;
  const isOptimistic = field.id.startsWith("optimistic-");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors
        ${field.is_active
          ? "bg-[#111318] border-[#1e2130]"
          : "bg-[#0d0f15] border-[#1a1d28] opacity-60"
        }
        ${isOptimistic ? "opacity-70" : ""}
      `}
    >
      {/* Drag handle — hidden for optimistic rows */}
      <button
        type="button"
        {...(isOptimistic ? {} : { ...attributes, ...listeners })}
        className={`shrink-0 transition-colors ${isOptimistic ? "opacity-20 cursor-default" : "cursor-grab active:cursor-grabbing text-[#374151] hover:text-[#4b5563]"}`}
        tabIndex={-1}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#f0f2f8] truncate">{field.field_label}</p>
        <p className="text-[11px] text-[#4b5563]">{typeLabel}</p>
      </div>

      {isOptimistic && (
        <Loader2 className="w-3.5 h-3.5 text-[#4b5563] animate-spin shrink-0" />
      )}

      {/* Toggle active */}
      {!isOptimistic && (
        <button
          type="button"
          onClick={() => !disabled && onToggle(field.id, !field.is_active)}
          disabled={disabled}
          className="text-[#4b5563] hover:text-[#9ca3af] transition-colors disabled:opacity-40"
          title={field.is_active ? "Disable field" : "Enable field"}
        >
          {field.is_active
            ? <Eye className="w-4 h-4" />
            : <EyeOff className="w-4 h-4" />}
        </button>
      )}

      {/* Delete */}
      {!isOptimistic && (
        confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-rose-400 whitespace-nowrap">Delete? History lost.</span>
            <button
              type="button"
              onClick={() => onDelete(field.id)}
              disabled={disabled}
              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded px-2 py-0.5 disabled:opacity-40"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-[#4b5563] hover:text-[#6b7280]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => !disabled && setConfirmDelete(true)}
            disabled={disabled}
            className="text-[#374151] hover:text-rose-400 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  fields: CrmFieldDef[];
  onFieldsChange: (updated: CrmFieldDef[]) => void;
}

export default function CloserFieldBuilder({ fields, onFieldsChange }: Props) {
  const [isPending, startTransition] = useTransition();
  const [addLabel, setAddLabel] = useState("");
  const [addType, setAddType]   = useState<FieldType>("number");
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex(f => f.id === active.id);
    const newIndex = fields.findIndex(f => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(fields, oldIndex, newIndex).map((f, i) => ({ ...f, field_order: i }));
    onFieldsChange(reordered);
    startTransition(() => { reorderCloserFields(reordered.map(f => f.id)); });
  }

  function handleToggle(id: string, active: boolean) {
    onFieldsChange(fields.map(f => f.id === id ? { ...f, is_active: active } : f));
    startTransition(() => { toggleCloserField(id, active); });
  }

  function handleDelete(id: string) {
    onFieldsChange(fields.filter(f => f.id !== id));
    startTransition(() => { deleteCloserField(id); });
  }

  async function handleAdd() {
    if (isAdding) return;
    setAddError(null);
    if (!addLabel.trim()) { setAddError("Enter a field label."); return; }

    const fd = new FormData();
    fd.set("field_label", addLabel.trim());
    fd.set("field_type", addType);

    setIsAdding(true);
    const result = await addCloserField(fd);
    setIsAdding(false);

    if (result.error) { setAddError(result.error); return; }

    // Optimistic entry — shown with a spinner until server refresh replaces it with real data
    onFieldsChange([...fields, {
      id:          "optimistic-" + Date.now(),
      user_id:     "",
      team_id:     null,
      field_name:  addLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      field_label: addLabel.trim(),
      field_type:  addType,
      field_order: fields.length,
      is_active:   true,
      created_at:  new Date().toISOString(),
    }]);
    setAddLabel("");
    setAddType("number");
  }

  const mutating = isPending || isAdding;

  return (
    <div className="space-y-4">

      {/* Warning */}
      <div className="flex items-start gap-2 text-[11px] text-amber-400/80 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl px-4 py-3">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>Deleting a field permanently removes its historical log data.</span>
      </div>

      {/* Field list */}
      {fields.length === 0 ? (
        <p className="text-sm text-[#4b5563] text-center py-4">No fields yet. Add your first below.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map(f => (
                <SortableFieldRow
                  key={f.id}
                  field={f}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  disabled={mutating}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add new field */}
      <div className="border-t border-[#1e2130] pt-4 space-y-3">
        <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Add Field</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Field label…"
            value={addLabel}
            onChange={e => setAddLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            className={inputCls + " flex-1"}
            disabled={mutating}
          />
          <select
            value={addType}
            onChange={e => setAddType(e.target.value as FieldType)}
            className={inputCls + " w-36"}
            disabled={mutating}
          >
            {TYPE_OPTIONS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={mutating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-sm font-semibold text-indigo-300 transition-colors disabled:opacity-50 shrink-0"
          >
            {isAdding
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Plus className="w-4 h-4" />
            }
            {isAdding ? "Adding…" : "Add"}
          </button>
        </div>
        {addError && <p className="text-xs text-rose-400">{addError}</p>}
      </div>
    </div>
  );
}
