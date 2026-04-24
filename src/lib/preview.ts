import { cookies } from "next/headers";

export const SBO_ADMIN_COOKIE = "apex_sbo_admin";
export const SBO_TEAM_ID = "c0ffee00-0000-0000-0000-000000000001";

export async function getSBOAdminMode(): Promise<boolean> {
  const store = await cookies();
  return store.get(SBO_ADMIN_COOKIE)?.value === "1";
}

export const PREVIEW_COOKIE = "apex_preview_role";

export const PREVIEW_ROLES = [
  { value: "closer",        label: "Closer"             },
  { value: "setter",        label: "Appointment Setter" },
  { value: "operator",      label: "Growth Operator"    },
  { value: "sales_manager", label: "Sales Manager"      },
  { value: "offer_owner",   label: "Offer Owner"        },
] as const;

export type PreviewRoleValue = (typeof PREVIEW_ROLES)[number]["value"];

const VALID: string[] = PREVIEW_ROLES.map((r) => r.value);

export async function getPreviewRole(): Promise<PreviewRoleValue | null> {
  const store = await cookies();
  const val   = store.get(PREVIEW_COOKIE)?.value;
  return VALID.includes(val ?? "") ? (val as PreviewRoleValue) : null;
}

export function previewRoleLabel(role: PreviewRoleValue): string {
  return PREVIEW_ROLES.find((r) => r.value === role)?.label ?? "Sales Rep";
}
