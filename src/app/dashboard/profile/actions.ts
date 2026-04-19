"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveProfile(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const full_name       = (formData.get("full_name")       as string).trim();
  const rawUsername     = (formData.get("username")         as string).trim().toLowerCase().replace(/\s+/g, "");
  const role            =  formData.get("role")             as string;
  const bio             = (formData.get("bio")              as string).trim().slice(0, 160);
  const leaderboard_opt_in = formData.get("leaderboard_opt_in") === "on";

  if (rawUsername && !/^[a-z0-9_-]{3,30}$/.test(rawUsername)) {
    return { error: "Username must be 3–30 characters: lowercase letters, numbers, _ or -" };
  }

  if (rawUsername) {
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", rawUsername)
      .neq("id", user.id)
      .maybeSingle();
    if (taken) return { error: "That username is already taken. Try another." };
  }

  const validRoles = ["closer", "setter", "operator", "manager"];
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name:            full_name || null,
      username:             rawUsername || null,
      role:                 validRoles.includes(role) ? role : "closer",
      bio,
      leaderboard_opt_in,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}
