// Pure data — no server imports. Safe to use in both client and server components.
import type { FieldType } from "./closer-crm-queries";

type TemplateField = {
  field_name: string;
  field_label: string;
  field_type: FieldType;
  field_order: number;
  is_active: true;
};

export type TemplateKey = "closer" | "setter";

export const CRM_TEMPLATES: Record<TemplateKey, {
  label: string;
  description: string;
  fieldLabels: string[];
  fields: TemplateField[];
}> = {
  closer: {
    label: "Closer",
    description: "Track daily call performance and revenue",
    fieldLabels: ["Calls Taken", "Calls Closed", "Total Revenue", "No Shows"],
    fields: [
      { field_name: "calls_taken",   field_label: "Calls Taken",   field_type: "number", field_order: 0, is_active: true },
      { field_name: "calls_closed",  field_label: "Calls Closed",  field_type: "number", field_order: 1, is_active: true },
      { field_name: "total_revenue", field_label: "Total Revenue", field_type: "number", field_order: 2, is_active: true },
      { field_name: "no_shows",      field_label: "No Shows",      field_type: "number", field_order: 3, is_active: true },
    ],
  },
  setter: {
    label: "Appointment Setter",
    description: "Track outbound activity and call booking",
    fieldLabels: ["Outbounds Sent", "Follow-ups Sent", "Calls Booked", "Replied", "Hours Worked"],
    fields: [
      { field_name: "outbounds_sent", field_label: "Outbounds Sent",  field_type: "number",   field_order: 0, is_active: true },
      { field_name: "followups_sent", field_label: "Follow-ups Sent", field_type: "number",   field_order: 1, is_active: true },
      { field_name: "calls_booked",   field_label: "Calls Booked",    field_type: "number",   field_order: 2, is_active: true },
      { field_name: "replied",        field_label: "Replied",         field_type: "number",   field_order: 3, is_active: true },
      { field_name: "hours_worked",   field_label: "Hours Worked",    field_type: "duration", field_order: 4, is_active: true },
    ],
  },
};
