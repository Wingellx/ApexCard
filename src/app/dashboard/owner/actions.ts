"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  revalidatePath("/dashboard/owner");
}
