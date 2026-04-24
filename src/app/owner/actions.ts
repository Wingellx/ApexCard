"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PREVIEW_COOKIE, PREVIEW_ROLES, SBO_ADMIN_COOKIE } from "@/lib/preview";

async function assertVerifiedOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("account_type, verified_owner")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.account_type !== "owner" || !profile.verified_owner) return null;
  return user;
}

export async function approveTeamById(teamId: string): Promise<void> {
  const user = await assertVerifiedOwner();
  if (!user) return;
  const admin = createAdminClient();
  await admin.from("teams").update({ status: "active" }).eq("id", teamId).eq("status", "pending");
  revalidatePath("/owner");
}

export async function declineTeamById(teamId: string): Promise<void> {
  const user = await assertVerifiedOwner();
  if (!user) return;
  const admin = createAdminClient();
  await admin.from("teams").update({ status: "declined" }).eq("id", teamId).eq("status", "pending");
  revalidatePath("/owner");
}

// ── Preview mode ──────────────────────────────────────────────

export async function setPreviewRole(role: string): Promise<void> {
  const user = await assertVerifiedOwner();
  if (!user) return;
  const valid = PREVIEW_ROLES.map((r) => r.value) as string[];
  if (!valid.includes(role)) return;
  const store = await cookies();
  store.set(PREVIEW_COOKIE, role, { path: "/", sameSite: "lax", httpOnly: true });
  redirect("/dashboard");
}

export async function clearPreviewRole(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const store = await cookies();
  store.delete(PREVIEW_COOKIE);
  redirect("/owner");
}

// ── SetByOffers admin demo mode ───────────────────────────────

export async function enterSBOAdminMode(): Promise<void> {
  const user = await assertVerifiedOwner();
  if (!user) return;
  const store = await cookies();
  store.set(SBO_ADMIN_COOKIE, "1", { path: "/", sameSite: "lax", httpOnly: true });
  redirect("/offers");
}

export async function exitSBOAdminMode(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const store = await cookies();
  store.delete(SBO_ADMIN_COOKIE);
  redirect("/owner");
}

export async function toggleShortlist(repId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("owner_shortlists")
    .select("id")
    .eq("owner_id", user.id)
    .eq("rep_id", repId)
    .maybeSingle();

  if (existing) {
    await admin.from("owner_shortlists").delete().eq("id", existing.id);
  } else {
    await admin.from("owner_shortlists").insert({ owner_id: user.id, rep_id: repId });
  }

  revalidatePath("/owner");
}
