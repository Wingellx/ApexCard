"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
