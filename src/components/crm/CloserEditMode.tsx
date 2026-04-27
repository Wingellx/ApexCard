"use client";

import { useState, useTransition } from "react";
import {
  GripVertical, Plus, Trash2, Eye, EyeOff, X, Loader2, ChevronDown,
} from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CRM_TEMPLATES, type TemplateKey } from "@/lib/crm-templates";
import type { CrmFieldDef, FieldType } from "@/lib/closer-crm-queries";
import {
  addCloserField, toggleCloserField, deleteCloserField,
  reorderCloserFields, addTemplateFields,
} from "@/app/dashboard/crm/closer-field-actions";

const TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: "number",   label: "Number"   },
  { value: "boolean",  label: "Yes / No" },
  { value: "text",     label: "Text"     },
  { value: "duration", label: "Duration" },
];

const TYPE_COLORS: Record<FieldType, string> = {
  number:   "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  boolean:  "bg-violet-500/10 text-violet-400 border-violet-500/20",
  text:     "bg-sky-500/10 text-sky-400 border-sky-500/20",
  duration: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

// ── Sortable row ──────────────────────────────────────────────────────────────

function SortableRow({
  field, onToggle, onDelete, disabled,
}: {
  field: CrmFieldDef;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  const isOptimistic = field.id.startsWith("optimistic-");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    disabled: isOptimistic,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.4 : 1,
    zIndex:     isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors
        ${field.is_active ? "bg-[#111318] border-[#1e2130]" : "bg-[#0d0f15] border-[#1a1d28]"}
        ${isOptimistic ? "opacity-60" : ""}
      `}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...(!isOptimistic ? { ...attributes, ...listeners } : {})}
        tabIndex={-1}
        className={`shrink-0 ${isOptimistic ? "opacity-20 cursor-default" : "cursor-grab active:cursor-grabbing text-[#374151] hover:text-[#6b7280]"}`}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Label + type badge */}
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <p className={`text-sm font-semibold truncate ${field.is_active ? "text-[#e5e7eb]" : "text-[#4b5563]"}`}>
          {field.field_label}
        </p>
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${TYPE_COLORS[field.field_type]}`}>
          {TYPE_OPTIONS.find(t => t.value === field.field_type)?.label ?? field.field_type}
        </span>
      </div>

      {isOptimistic && <Loader2 className="w-3.5 h-3.5 text-[#4b5563] animate-spin shrink-0" />}

      {!isOptimistic && (
        <>
          {/* Toggle */}
          <button
            type="button"
            onClick={() => !disabled && onToggle(field.id, !field.is_active)}
            disabled={disabled}
            title={field.is_active ? "Hide field" : "Show field"}
            className="text-[#4b5563] hover:text-[#9ca3af] transition-colors disabled:opacity-40 shrink-0"
          >
            {field.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-rose-400 whitespace-nowrap">Delete?</span>
              <button
                type="button"
                onClick={() => onDelete(field.id)}
                disabled={disabled}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-40"
              >
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="text-[#4b5563] hover:text-[#6b7280]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => !disabled && setConfirmDelete(true)}
              disabled={disabled}
              className="text-[#374151] hover:text-rose-400 transition-colors disabled:opacity-40 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  fields: CrmFieldDef[];
  onFieldsChange: (updated: CrmFieldDef[]) => void;
  onDone: () => void;
}

export default function CloserEditMode({ fields, onFieldsChange, onDone }: Props) {
  const [isPending, startTransition] = useTransition();
  const [addLabel, setAddLabel]  = useState("");
  const [addType, setAddType]    = useState<FieldType>("number");
  const [addError, setAddError]  = useState<string | null>(null);
  const [isAdding, setIsAdding]  = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [loadingTpl, setLoadingTpl]     = useState<TemplateKey | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oi = fields.findIndex(f => f.id === active.id);
    const ni = fields.findIndex(f => f.id === over.id);
    if (oi === -1 || ni === -1) return;
    const reordered = arrayMove(fields, oi, ni).map((f, i) => ({ ...f, field_order: i }));
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
    if (result.field) {
      onFieldsChange([...fields, result.field]);
    } else {
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
    }
    setAddLabel("");
    setAddType("number");
  }

  async function handleAddTemplate(key: TemplateKey) {
    setLoadingTpl(key);
    const result = await addTemplateFields(key);
    setLoadingTpl(null);
    if (result.fields) {
      onFieldsChange([...fields, ...result.fields]);
    }
    setTemplateOpen(false);
  }

  const mutating = isPending || isAdding || !!loadingTpl;

  const inputCls = "bg-[#0d0f15] border border-[#1e2130] rounded-xl px-3 py-2.5 text-sm text-[#f0f2f8] placeholder-[#374151] focus:outline-none focus:border-indigo-500 transition-colors";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#4b5563] uppercase tracking-widest">Edit Fields</p>
          <p className="text-[11px] text-[#374151] mt-0.5">Drag to reorder · tap eye to show/hide</p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 hover:text-indigo-200 text-sm font-bold rounded-xl transition-colors"
        >
          Done
        </button>
      </div>

      {/* Field list */}
      {fields.length === 0 ? (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-8 text-center">
          <p className="text-sm text-[#4b5563]">No fields yet — add your first one below.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden divide-y divide-[#1a1d28]">
              {fields.map(f => (
                <SortableRow key={f.id} field={f} onToggle={handleToggle} onDelete={handleDelete} disabled={mutating} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add field */}
      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-5 space-y-3">
        <p className="text-[11px] font-semibold text-[#4b5563] uppercase tracking-wider">Add Field</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Field label…"
            value={addLabel}
            onChange={e => setAddLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            disabled={mutating}
            className={inputCls + " flex-1"}
          />
          <select
            value={addType}
            onChange={e => setAddType(e.target.value as FieldType)}
            disabled={mutating}
            className={inputCls + " w-32"}
          >
            {TYPE_OPTIONS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={mutating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-sm font-bold text-indigo-300 transition-colors disabled:opacity-50 shrink-0"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "Adding…" : "Add"}
          </button>
        </div>
        {addError && <p className="text-xs text-rose-400">{addError}</p>}

        {/* Add template */}
        <div className="pt-1 border-t border-[#1a1d28]">
          <button
            type="button"
            onClick={() => setTemplateOpen(o => !o)}
            className="flex items-center gap-1.5 text-[11px] text-[#4b5563] hover:text-[#6b7280] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add template fields
            <ChevronDown className={`w-3 h-3 transition-transform ${templateOpen ? "rotate-180" : ""}`} />
          </button>

          {templateOpen && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(Object.keys(CRM_TEMPLATES) as TemplateKey[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleAddTemplate(key)}
                  disabled={mutating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0d0f15] hover:bg-[#1a1d28] border border-[#1e2130] rounded-lg text-[#9ca3af] transition-colors disabled:opacity-50"
                >
                  {loadingTpl === key ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {CRM_TEMPLATES[key].label} template
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[#374151] text-center">Deleting a field permanently removes its log history.</p>
    </div>
  );
}
