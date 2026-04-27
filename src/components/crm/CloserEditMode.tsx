"use client";

import { useState, useTransition } from "react";
import {
  GripVertical, Plus, Trash2, Eye, EyeOff, X, Loader2, ChevronDown, Check,
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
  { value: "duration", label: "Duration" },
  { value: "text",     label: "Text"     },
];

const TYPE_BADGE: Record<FieldType, string> = {
  number:   "bg-indigo-500/10 text-indigo-400  border border-indigo-500/20",
  boolean:  "bg-violet-500/10 text-violet-400  border border-violet-500/20",
  duration: "bg-amber-500/10  text-amber-400   border border-amber-500/20",
  text:     "bg-sky-500/10    text-sky-400     border border-sky-500/20",
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
    disabled: isOptimistic || disabled,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    opacity:    isDragging ? 0.35 : 1,
    zIndex:     isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-5 py-4 transition-colors
        ${isDragging ? "bg-[#1a1d28]" : ""}
        ${!field.is_active && !isDragging ? "opacity-50" : ""}
        ${isOptimistic ? "opacity-40" : ""}
      `}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...(!isOptimistic && !disabled ? { ...attributes, ...listeners } : {})}
        tabIndex={-1}
        aria-label="Drag to reorder"
        className={`shrink-0 p-0.5 rounded transition-colors
          ${isOptimistic || disabled
            ? "text-[#1e2130] cursor-default"
            : "text-[#2a2f45] hover:text-[#4b5563] cursor-grab active:cursor-grabbing"
          }`}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Label + type badge */}
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        <p className={`text-sm font-semibold truncate ${field.is_active ? "text-[#e5e7eb]" : "text-[#6b7280]"}`}>
          {field.field_label}
        </p>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md ${TYPE_BADGE[field.field_type]}`}>
          {TYPE_OPTIONS.find(t => t.value === field.field_type)?.label ?? field.field_type}
        </span>
      </div>

      {/* Spinner for optimistic rows */}
      {isOptimistic && <Loader2 className="w-3.5 h-3.5 text-[#4b5563] animate-spin shrink-0" />}

      {!isOptimistic && (
        <>
          {/* Visibility toggle */}
          <button
            type="button"
            onClick={() => !disabled && onToggle(field.id, !field.is_active)}
            disabled={disabled}
            title={field.is_active ? "Hide field" : "Show field"}
            className="shrink-0 p-1.5 rounded-lg text-[#374151] hover:text-[#9ca3af] hover:bg-white/[0.04] disabled:opacity-40 transition-colors"
          >
            {field.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onDelete(field.id)}
                disabled={disabled}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-40"
              >
                <Check className="w-3 h-3" />
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="p-1 text-[#4b5563] hover:text-[#9ca3af] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => !disabled && setConfirmDelete(true)}
              disabled={disabled}
              title="Delete field"
              className="shrink-0 p-1.5 rounded-lg text-[#2a2f45] hover:text-rose-400 hover:bg-rose-500/[0.05] disabled:opacity-40 transition-colors"
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
    if (!addLabel.trim()) { setAddError("Please enter a field label."); return; }

    const fd = new FormData();
    fd.set("field_label", addLabel.trim());
    fd.set("field_type", addType);

    setIsAdding(true);
    const result = await addCloserField(fd);
    setIsAdding(false);

    if (result.error) {
      setAddError("Couldn't add field — please try again.");
      return;
    }
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

  const inputCls = "bg-[#0d0f15] border border-[#1e2130] rounded-xl px-3 py-2.5 text-sm text-[#f0f2f8] placeholder-[#2a2f45] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors";

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#374151] uppercase tracking-[0.15em]">Edit Fields</p>
          <p className="text-[11px] text-[#2a2f45] mt-0.5">Drag to reorder · eye to show / hide</p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors shadow-[0_0_16px_rgba(99,102,241,0.15)]"
        >
          Done
        </button>
      </div>

      {/* Field list */}
      {fields.length === 0 ? (
        <div className="bg-[#111318] border border-[#1e2130] rounded-2xl p-10 text-center">
          <p className="text-sm text-[#4b5563]">No fields yet — add your first one below.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden divide-y divide-[#13161e]">
              {fields.map(f => (
                <SortableRow
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

      {/* Add field */}
      <div className="bg-[#111318] border border-[#1e2130] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#13161e]">
          <p className="text-[10px] font-bold text-[#374151] uppercase tracking-[0.15em]">Add Field</p>
        </div>

        <div className="px-5 py-4 space-y-3">
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
              className={inputCls + " w-[110px] shrink-0"}
            >
              {TYPE_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={mutating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-sm font-semibold text-[#9ca3af] hover:text-[#e5e7eb] transition-colors disabled:opacity-50"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "Adding…" : "Add Field"}
          </button>

          {addError && (
            <p className="text-xs text-rose-400 px-1">{addError}</p>
          )}
        </div>

        {/* Add template section */}
        <div className="border-t border-[#13161e]">
          <button
            type="button"
            onClick={() => setTemplateOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-[11px] font-semibold text-[#4b5563] hover:text-[#6b7280] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add template fields
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${templateOpen ? "rotate-180" : ""}`} />
          </button>

          {templateOpen && (
            <div className="px-5 pb-4 flex flex-wrap gap-2">
              {(Object.keys(CRM_TEMPLATES) as TemplateKey[]).map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleAddTemplate(key)}
                  disabled={mutating}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0d0f15] hover:bg-[#1a1d28] border border-[#1e2130] rounded-lg text-[#9ca3af] hover:text-[#e5e7eb] transition-colors disabled:opacity-50"
                >
                  {loadingTpl === key && <Loader2 className="w-3 h-3 animate-spin" />}
                  {CRM_TEMPLATES[key].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-[#2a2f45] text-center pb-1">
        Deleting a field permanently removes its log history.
      </p>
    </div>
  );
}
